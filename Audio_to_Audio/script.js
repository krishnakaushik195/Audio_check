let transcriber, generator;
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// Initialize models
async function initializeModels() {
    try {
        console.log("Loading transcriber model...");
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
        console.log("Transcriber model loaded successfully:", transcriber);

        console.log("Loading generator model...");
        generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-783M');
        console.log("Generator model loaded successfully:", generator);
    } catch (error) {
        console.error("Error loading models:", error);
        displayMessage("Error loading models.", 'bot-message');
    }
}

// Display message in the chat container
function displayMessage(message, className) {
    const messageElement = document.createElement('div');
    messageElement.className = className;
    messageElement.innerText = message;
    document.getElementById('chat-container').appendChild(messageElement);
    document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;
}

// Handle user text input
async function handleUserInput() {
    const userInput = document.getElementById('user-input').value.trim();
    if (!userInput) return;
    
    displayMessage("You: " + userInput, 'user-message');
    document.getElementById('user-input').value = "";

    await generateResponse(userInput);
}

// Toggle recording
async function toggleRecording() {
    isRecording = !isRecording;

    if (isRecording) {
        document.getElementById('record-button').innerText = "⏹️"; // Change to Stop icon
        startRecording();
    } else {
        document.getElementById('record-button').innerText = "🎙️"; // Change to Mic icon
        stopRecording();
    }
}

// Start audio recording
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.start();
        console.log("Recording started.");
    } catch (error) {
        console.error("Error starting recording:", error);
        displayMessage("Error starting recording.", 'bot-message');
    }
}

// Stop recording and transcribe
async function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks);
        const url = URL.createObjectURL(audioBlob);

        try {
            console.log("Transcribing audio...");
            const result = await transcriber(url);
            const transcribedText = result?.text || "Error in transcription.";
            console.log("Transcription result:", transcribedText);

            // Display transcribed text
            displayMessage("You (voice): " + transcribedText, 'user-message');

            // Generate response based on transcribed text
            await generateResponse(transcribedText);
        } catch (error) {
            console.error("Error in transcription:", error);
            displayMessage("Error in transcription.", 'bot-message');
        }
    };
}

// Generate a response using text generation model
async function generateResponse(inputText) {
    console.log("Generating response for input:", inputText);

    try {
        console.log("Input text before sending to generator:", inputText);
        
        const result = await generator(inputText, { max_new_tokens: 100 });
        const generatedText = result;
        console.log("Generated response text:", generatedText);

        displayMessage("Bot: " + generatedText, 'bot-message');
        speakText(generatedText);
    } catch (error) {
        console.error("Error in response generation:", error);
        displayMessage("Error in response generation: " + error.message, 'bot-message');
    }
}

// Speak the generated text
function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
}

// Initialize models when the page loads
window.addEventListener("DOMContentLoaded", initializeModels);