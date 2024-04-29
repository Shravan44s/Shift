from flask import Flask, render_template, request, jsonify
from flask_cors import CORS 
from google.oauth2 import service_account
import google.auth.transport.requests
from PIL import Image
from io import BytesIO
import base64
import keyboard as k
from lens.src.google_img_source_search.reverse_image_searcher import ReverseImageSearcher

app = Flask(__name__, template_folder='templates', static_url_path='/static')
CORS(app) 
# specify the scopes
SCOPES = ['https://www.googleapis.com/auth/cloud-platform']

# Load the credentials from the service account file
credentials = service_account.Credentials.from_service_account_file(
    'shift-405505-4f95ae6c6d88.json', scopes=SCOPES)

# Create a requests Session object with the credentials
authed_session = google.auth.transport.requests.AuthorizedSession(credentials)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    return render_template('chat.html')

@app.route('/tailor')
def tailor():
    return render_template('tailor.html', data=image_url)
    
@app.route('/generate_images', methods=['POST'])
def generate_images():
    try:
        # Get text prompt from the request
        text_prompt = request.json.get('textPrompt', '')
        # Prepare the request body
        data = {
            "instances": [
                {"prompt": text_prompt}
            ],  
            "parameters": {
                "sampleCount": 3,
                "temperature": 1.0,
                "maxOutputTokens": 256,
                "topK": 90,
                "topP": 0.99
            }
        }

        # Send the request
        response = authed_session.post(
            f"https://us-central1-aiplatform.googleapis.com/v1/projects/shift-405505/locations/us-central1/publishers/google/models/imagegeneration:predict",
            json=data
        )

        # Parse the response
        response_data = response.json()
        predictions = response_data.get('predictions', [])
        image_filenames = []
        for i, prediction in enumerate(predictions):
            try:
                with open('static/genai.txt', 'r') as file:
                    curr = int(file.read().strip())
                    # print(curr)
            except FileNotFoundError:
                print('error')
            newcurr = curr+1
            filename = f"static/gen_images/{newcurr}.png"
            with open('static/genai.txt', 'w') as file1:
                file1.write(str(newcurr))
            img_bytes = base64.b64decode(prediction['bytesBase64Encoded'])
            img = Image.open(BytesIO(img_bytes))
            img.save(filename)
            # Append the filename to the list
            image_filenames.append(filename)
        # print(image_filenames)
        return jsonify({"success": True, "image_filenames": image_filenames})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}) 

img_url_global=None
@app.route('/image_linker', methods=['POST'])
def image_linker():
    try:
        global image_url 
        image_url = request.json.get('imagelink', '')
        rev_img_searcher = ReverseImageSearcher()
        res = rev_img_searcher.search(image_url)
        for search_item in res:
            print(f'Title: {search_item.page_title}')
            print(f'Site: {search_item.page_url}')
            print(f'Img: {search_item.image_url}\n')
        serialized_items = []
        for item in res:
            serialized_item = {
                "title": item.page_title,
                "link": item.page_url,
                "image": item.image_url,
                # Add more attributes as needed
            }
            serialized_items.append(serialized_item)

        # Serialize the list of dictionaries to JSON
        # json_data = json.dumps(serialized_items, indent=4)
        json_data=serialized_items
        if res:
            return jsonify({"success": True, "res": json_data})
        else:
            return  jsonify({"success": False, "error" : "No result found!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}) 

@app.route('/contacttailor', methods=['POST'])
def contact_tailor():
    try:
        import pywhatkit
        import os
        image_url = request.json.get('imageurl', '')
        given_path = r'.\static\gen_images'
        filename = os.path.basename(image_url)
        full_path = os.path.join(given_path, filename)
        phonenum = '+917349353427'
        pywhatkit.sendwhats_image(phonenum, full_path, 'Hi there, Tailor "SHIFT", I wanted this dress to be stitched, help me with this! ')
        k.press_and_release('enter')
        return jsonify({"success": True})
    except Exception as e:
        print(e)
        return jsonify({"success": False})

if __name__ == '__main__':
    app.run(debug=True)
