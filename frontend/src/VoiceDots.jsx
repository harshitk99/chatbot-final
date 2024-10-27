import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const VoiceDots = () => {
  const [isListening, setIsListening] = useState(false);
  const [dotSizes, setDotSizes] = useState([15, 15, 15, 15]);
  const [transcript, setTranscript] = useState('');
  const [backendResponse, setBackendResponse] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event) => {
        const currentTranscript = event.results[event.results.length - 1][0].transcript;
        setTranscript(currentTranscript);
        setSpeaking(true);
        sendMessageToBackend(currentTranscript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error: ', event.error);
      };

      recognitionInstance.onend = () => {
        setSpeaking(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setSpeaking(false);
      setDotSizes([15, 15, 15, 15]);
    }
  };

  const sendMessageToBackend = async (message) => {
    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: message }),
      });
      const data = await response.json();
      setBackendResponse(data.obj.reply);
    } catch (error) {
      console.error("Error connecting to backend:", error);
    }
  };

  useEffect(() => {
    let interval;
    if (speaking) {
      interval = setInterval(() => {
        setDotSizes((prevDotSizes) => {
          return prevDotSizes.map(() => Math.floor(Math.random() * 25) + 10);
        });
      }, 200);
    } else {
      setDotSizes([15, 15, 15, 15]);
    }
    return () => clearInterval(interval);
  }, [speaking]);

  const renderBackendResponse = () => {
    try {
      const parsedResponse = JSON.parse(backendResponse);
      if (Array.isArray(parsedResponse)) {
        return (
          <table className={`${isDarkMode ? 'text-white' : 'text-black'} mt-4 border border-gray-500`}>
            <thead>
              <tr>
                {Object.keys(parsedResponse[0]).map((header, index) => (
                  <th key={index} className="px-4 py-2 border border-gray-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedResponse.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 border border-gray-500">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      } else {
        return <p className={`${isDarkMode ? 'text-white' : 'text-black'} mt-4 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg`}>{backendResponse}</p>;
      }
    } catch (error) {
      return <p className={`${isDarkMode ? 'text-white' : 'text-black'} mt-4 p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-lg`}>{backendResponse}</p>;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      {/* Toggle Theme Button */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)} 
        className="absolute top-4 right-4 p-2 rounded-md border transition-colors duration-200 hover:bg-gray-300"
        aria-label="Toggle theme">
        {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </button>

      {/* Animated Heading */}
      <motion.h1 
        className="text-3xl font-bold mb-8"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        AI CHATBOT
      </motion.h1>

      <div className="flex space-x-3 mb-8">
        {dotSizes.map((size, index) => (
          <div
            key={index}
            className={`${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              transition: 'width 0.2s, height 0.2s',
            }}
          ></div>
        ))}
      </div>

      <input
        type="text"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Your speech will appear here"
        className={`w-10/12 p-2 mb-6 text-center ${isDarkMode ? 'bg-black text-white border-gray-700' : 'bg-white text-black border-gray-300'} border-b-2 focus:outline-none focus:border-current`}
      />

      <div className="flex space-x-4">
        <button
          onClick={startListening}
          disabled={isListening}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            isListening ? 'bg-gray-500 text-gray-400' : `${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-300 text-black'} hover:bg-gray-600`
          }`}
        >
          Start Listening
        </button>
        <button
          onClick={stopListening}
          disabled={!isListening}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            !isListening ? 'bg-gray-500 text-gray-400' : 'bg-red-600 text-white hover:bg-red-500'
          }`}
        >
          Stop Listening
        </button>
      </div>

      <p className="mt-5 text-sm text-gray-400">{isListening ? 'Listening...' : 'Not Listening'}</p>

      {/* Display backend response in cleaner format */}
      <div className="mt-5 w-10/12">{renderBackendResponse()}</div>
    </div>
  );
};

export default VoiceDots;
