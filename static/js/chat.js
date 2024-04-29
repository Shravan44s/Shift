import { createToast } from '../toast/script.js'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseurl = 'https://kwaxoydcynkxkotnjtct.supabase.co'
const supabasekey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3YXhveWRjeW5reGtvdG5qdGN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAzMTk5OTAsImV4cCI6MjAxNTg5NTk5MH0.HMHaUc_wL2RrT_sJ9vQUqz1NxlBpjT_pMM0wVAtNxRE'

const supabase = createClient(supabaseurl, supabasekey);

const chatInput = document.querySelector(".chat-input");
const sendButton = document.querySelector(".send-btn");
const chatContainer = document.querySelector(".chat-container");
const deleteButton = document.querySelector(".delete-btn");
const themeButton = document.querySelector(".theme-btn");


const loadDataFromLocalStorage = () => {
    const themeColor = localStorage.getItem("themeColor");
    document.body.classList.toggle("light-mode", themeColor === "light_mode");
    themeButton.innerHTML = document.body.classList.contains("light-mode")
        ? `<img src="static/assets/night.png" alt="Dark Mode" width="30px" height="30px" >`
        : `<img src="static/assets/sun.png" alt="Light Mode" width="30px" height="30px" >`;

    const defaultText = `<div class="default-text">
                                <h1>Shift</h1>
                                <h3>Explore the world of Fashion.</h3>
                            </div>`;

    chatContainer.innerHTML = localStorage.getItem("all-chats") || defaultText;
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

const createChatElement = (content, className) => {
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = content;
    return chatDiv;
};

const handleOutgoingChat = async () => {
    let UserText = chatInput.value.trim();
    if (!UserText) return;

    chatInput.value = "";
    chatInput.style.height = `${initialInputHeight}px`;

    const html = `<div class="chat-content">
                        <div class="chat-details">
                            <img src="static/assets/user.png" alt="user-img">
                            <p>${UserText}</p>
                        </div>
                    </div>`;

    const outChatDiv = createChatElement(html, "outgoing");
    chatContainer.querySelector(".default-text")?.remove();
    chatContainer.appendChild(outChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    await request(UserText);
    setTimeout(showTypingAnimation, 500);
};

const showTypingAnimation = () => {
    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="static/assets/designer.png" alt="chatbot-img">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s"></div>
                            <div class="typing-dot" style="--delay: 0.3s"></div>
                            <div class="typing-dot" style="--delay: 0.4s"></div>
                        </div>
                    </div>
                </div>`;
    const inChatDiv = createChatElement(html, "incoming");
    chatContainer.appendChild(inChatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    setTimeout(response1(inChatDiv), 2000);
};

deleteButton.addEventListener("click", () => {
    localStorage.removeItem("all-chats");
    loadDataFromLocalStorage();
});


themeButton.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    localStorage.setItem("themeColor", themeButton.innerText);
    themeButton.innerHTML = document.body.classList.contains("light-mode")
        ? `<img src="static/assets/night.png" alt="Dark Mode" width="30px" height="30px" >`
        : `<img src="static/assets/sun.png" alt="Light Mode" width="30px" height="30px" >`;
});

const initialInputHeight = chatInput.scrollHeight;

chatInput.addEventListener("input", () => {
    chatInput.style.height = `${initialInputHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleOutgoingChat();
    }
});

loadDataFromLocalStorage();
sendButton.addEventListener("click", handleOutgoingChat);

function generateImages(textPrompt, inChatDiv) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/generate_images", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = xhr.responseText;
            var jsonResponse = JSON.parse(data);
            imageviewer(inChatDiv, jsonResponse["image_filenames"][0], jsonResponse["image_filenames"][1], jsonResponse["image_filenames"][2]);
        } else {
            alert("Error generating images. Please try again.");
        }
    };
    xhr.send(JSON.stringify({ textPrompt: textPrompt }));
}

const imageviewer = (inChatDiv, a, b, c) => {
    if (a && b && c) {
        let html = `<div class="images">
        <img src="${a}" class="thumbnail" alt="img1" id="img1" title="${a}">
        <img src="${b}" class="thumbnail" alt="img2" id="img2" title="${b}">
        <img src="${c}" class="thumbnail" alt="img3" id="img3" title="${c}">
        </div>`
        inChatDiv.querySelector("h3").remove();
        const imagediv = createChatElement(html, "imagesdiv");
        inChatDiv.querySelector(".chat-details").appendChild(imagediv);
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
        document.getElementById("img1").addEventListener("click", (id) => {
            openimg(id.srcElement.title)
        })
        document.getElementById("img2").addEventListener("click", (id) => {
            openimg(id.srcElement.title)
        })
        document.getElementById("img3").addEventListener("click", (id) => {
            openimg(id.srcElement.title)
        })
    } else {
        console.log('Image error')
        alert('Image not found');
    }
}

let databrowser = "";
const request = async (prompt) => {
    const payload = {
        prompt: {
            text: `PaLM, analyze ${prompt} and extract essential parameters for generating high-quality, full-size fashion images. Prioritize details relevant to dress generation, avoiding unrelated text. Provide the model with instructions to focus on quick and effective dress generation while maintaining image quality. The goal is to advise the user on what to wear based on the extracted parameters. Ensure that the output is a concise, one-line description to guide the image generation process and nothing else.`
        }
    };
    // Define the URL for the Google Cloud Language API
    const url = "https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=AIzaSyC2dDolrqQlA22XwgGMKvUmZrxKaMlAjRM";
    // Make the POST request
    await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(response => response.json())
        .then(data => {
            databrowser = data.candidates[0].output;
        })
        .catch(error => {
            console.error('Error:', error);
        });
};

const response1 = (inChatDiv) => {
    try {
        inChatDiv.querySelector(".typing-animation").remove();
        const message = removeStarsAndFormat(databrowser);
        const messageElement = document.createElement("p");
        messageElement.innerHTML = message;
        const loading = document.createElement("h3");
        loading.innerHTML = "Generating Images...";
        inChatDiv.querySelector(".chat-details").appendChild(messageElement);
        inChatDiv.querySelector(".chat-details").appendChild(loading);
        generateImages(message, inChatDiv);
    }
    catch (error) {
        inChatDiv.querySelector(".typing-animation").remove();
        const errorMessage = "Sorry, I can't assist you with this.";
        const errorElement = document.createElement("p");
        errorElement.textContent = errorMessage;
        inChatDiv.querySelector(".chat-details").appendChild(errorElement);
        console.log(error);
    }
};

function removeStarsAndFormat(text) {
    // Remove stars
    text = text.replace(/\*/g, '');
    
    // Format properly
    text = text.replace(/\n\n/g, '<br>');
    text = text.replace(/\n/g, '<br>&#8226; ');

    return text;
}
function openimg(id) {
    const a = `
      <div class="scissors"> 
        <img src="static/assets/scissors.png" alt="scissors" id="scissors">
      </div>
      <img src="${id}" class="thumbnail" alt="img1">
      <div class="avail">
        <h1>Available on</h1>
      </div>
      <div class="availinfo" id="availinfo">
        Loading...
      </div>
      <div class="tailor">
        <button id="tailorsupport">Contact Tailor</button>
      </div>`;
    uploadAndRetrieveUrl(id);
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("maxcontainer");
    chatDiv.id = "maxcontainer";
    chatDiv.innerHTML = a;
    const chatContainer = document.querySelector(".chat-container");
    chatContainer.appendChild(chatDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    const scissor = document.getElementById("scissors");
    scissor.addEventListener("click", () => {
        document.getElementById("maxcontainer").style.display = "none";
    })
    document.getElementById("tailorsupport").onclick = function() { localStorage.setItem("image", id); window.location.replace('tailor') };
};
async function uploadAndRetrieveUrl(filePath) {
    try {
        const fileName = filePath.split('/').pop(); // Extract filename from path

        // Read the file from local storage
        const file = await readFile(filePath);

        // Upload the file to Supabase storage
        const { data, error } = await supabase.storage.from('images').upload(fileName, file);

        if (error) {
            throw error;
        }

        // Retrieve the public URL of the uploaded file
        const imageUrl = supabase.storage.from('images').getPublicUrl(fileName);

        imagelinker(imageUrl.data.publicUrl);
    } catch (error) {
        console.error('Error uploading file:', error.message);
        alert('Error uploading file:', error.message);
    }
}

// Function to read a file from local storage
function readFile(filePath) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        fetch(filePath)
            .then(response => response.blob())
            .then(blob => reader.readAsArrayBuffer(blob))
            .catch(error => reject(error));
    });
}


function imagelinker(imgurl) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/image_linker", true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onload = function () {
        if (xhr.status === 200) {
            var data = xhr.responseText;
            var jsonResponse = JSON.parse(data);
            imagelinkerdisplay(jsonResponse.res)

        } else {
            alert("Error generating images. Please try again.");
        }
    };
    xhr.send(JSON.stringify({ imagelink: imgurl }));
}

function imagelinkerdisplay(a) {
    document.getElementById('availinfo').innerHTML='';
    if(a===undefined) {
        document.getElementById('availinfo').innerHTML='<h1>Contact Tailor</h1>';
    } else {
        for (var i = 0; i < a.length, i<3; i++) {
            let a1 =
            `
              <img src="${a[i]['image']}"
              alt="Dress">
              <h4>${a[i]['title']}</h4>
              <a href="${a[i]['link']}" target="_blank">Go to site🌐</a>
            `;
            let div = document.createElement('div');
            div.className += 'linkcard';
            div.innerHTML = a1;
            document.getElementById('availinfo').appendChild(div);
            document.getElementById('availinfo').scrollTo(0, document.getElementById('availinfo').scrollHeight);
        }
    }
}