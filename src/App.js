import React, { useState, useRef } from 'react';
import './App.css';

const uuid = require('uuid');

function App() {
  const [uploadResultMessage, setUploadResultMessage] = useState(
    'Please upload image to authenticate'
  );
  const [visitorName, setVisitorName] = useState('placeholder.jpeg');
  const [isAuth, setAuth] = useState(false);
  const [visitorCounter, setVisitorCounter] = useState(1); // Counter for naming visitors
  const videoRef = useRef();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;

    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const imageFile = new File([blob], `visitor${visitorCounter}.jpeg`, { type: 'image/jpeg' });
        setVisitorName(`visitor${visitorCounter}.jpeg`);
        setVisitorCounter((prevCounter) => prevCounter + 1); // Increment the counter
        uploadImage(imageFile);
      }, 'image/jpeg');
    }
  };

  const uploadImage = (image) => {
    const visitorImageName = uuid.v4();

    fetch(
      `https://sh52moycog.execute-api.us-east-1.amazonaws.com/dev/ks-visitor-images/${visitorImageName}.jpeg`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        body: image,
      }
    )
      .then(async () => {
        const response = await authenticate(visitorImageName);
        console.log(response);
        if (response.Message === 'Success') {
          setAuth(true);
          setUploadResultMessage(
            `Hi ${response['firstName']} ${response['lastName']}, welcome to work. Hope you have a productive day`
          );
        } else {
          setAuth(false);
          setUploadResultMessage(' Authentication failed: This person is not employed.');
        }
      })
      .catch((error) => {
        setAuth(false);
        setUploadResultMessage('There is an error during the authentication process');
        console.error(error);
      });
  };

  async function authenticate(visitorImageName) {
    const requestUrl =
      'https://sh52moycog.execute-api.us-east-1.amazonaws.com/dev/employee?' +
      new URLSearchParams({
        objectKey: `${visitorImageName}.jpeg`,
      });

    return await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        return data;
      })
      .catch((error) => console.log('Error during authentication:', error));
  }

  return (
    <div className="App">
      <h2>Facial Recognition system</h2>
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={captureImage}>Capture Image</button>
      <div>
        <video ref={videoRef} width={320} height={240} autoPlay muted />
      </div>
      <div className={isAuth ? 'success' : 'failure'}>{uploadResultMessage}</div>
      <img src={`./visitors/${visitorName}`} alt="Visitor" height={250} width={250} />
    </div>
  );
}

export default App;
