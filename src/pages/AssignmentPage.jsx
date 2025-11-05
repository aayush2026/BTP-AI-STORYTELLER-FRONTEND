import ProgressBar from "@/components/ProgressBar";
import RecordButton from "@/components/RecordButton";
import NavigationButton from "@/components/NavigationButton";
import QuestionCard from "@/components/QuestionCard";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MoonLoader } from "react-spinners";
import axios from "axios";
/* const questions = [
  "Tell me about your favorite magical creature. What makes it special?",
  "If you could explore any place in the world, where would you go and why?",
  "Imagine you found a treasure chest. What would be inside it?",
  "If you could have any superpower, what would it be and how would you help others?",
  "Create a short story about a brave little star that fell from the sky.",
]; */

export default function Assessment() {
  const { sid } = useParams();
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(Array(5).fill(""));
  const [isRecording, setIsRecording] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/story/getQuestions/${sid}`, {
          withCredentials: true, // Axios uses withCredentials instead of credentials
        });

        if (response.status === 200) {
          const data = response.data; // Axios already parses JSON, use response.data
          console.log("Fetched questions:", data.assignment?.questions);
          setQuestions(data.assignment?.questions.map(q => q.question) || []);
          setLoading(false);
        } else {
          console.error("Failed to fetch questions: ", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [sid]);

  useEffect(() => {
    console.log("Questions", questions);
  }, [questions]);

  useEffect(() => {
    setSpeechSynthesis(window.speechSynthesis);

    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      // Initialize the speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      // Create a new instance of the speech recognition
      const recognitionInstance = new SpeechRecognition();
      // Set the continuous flag to true
      recognitionInstance.continuous = true;
      // Set the interim results flag to true
      recognitionInstance.interimResults = true;

      recognitionInstance.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        setCurrentTranscript(transcript);

        const wordCount = transcript.trim().split(/\s+/).filter(word => word.length > 0).length;
        setCanProceed(wordCount >= 5);

        console.log(
          `Question ${currentQuestion + 1} - Current Answer:`,
          transcript
        );
        console.log("Word count:", wordCount);
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error === 'no-speech') {
          console.log("No speech detected");
        } else if (event.error === 'not-allowed') {
          alert("Microphone permission denied. Please allow microphone access.");
        } else if (event.error === 'aborted') {
          console.log("Recognition aborted");
        }
      };

      recognitionInstance.onend = () => {
        // Recognition ended (either by user or automatically)
        // Use a small delay to ensure state is updated properly
        setTimeout(() => {
          setIsRecording(false);
        }, 100);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const speakText = (text) => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (currentQuestion >= 0) {
      speakText(questions[currentQuestion]);
      setCurrentTranscript(answers[currentQuestion] || "");
      setCanProceed(
        answers[currentQuestion]?.trim().split(/\s+/).length >= 5 || false
      );
    }
  }, [currentQuestion]);

  const handleRecordStart = (e) => {
    e.preventDefault(); // Prevent default behavior
    if (recognition && !isRecording) {
      try {
        setIsRecording(true);
        setCurrentTranscript("");
        recognition.start();
        console.log("Recording started");
      } catch (error) {
        console.error("Error starting recording:", error);
        setIsRecording(false);
        alert("Failed to start recording. Please check microphone permissions.");
      }
    }
  };

  const handleRecordEnd = (e) => {
    e.preventDefault(); // Prevent default behavior
    if (recognition && isRecording) {
      try {
        recognition.stop();
        setIsRecording(false);

        // Update answers with the current transcript
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = currentTranscript;
        setAnswers(newAnswers);

        console.log("Recording stopped. Updated Answers Array:", newAnswers);
      } catch (error) {
        console.error("Error stopping recording:", error);
        setIsRecording(false);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setCanProceed(false);
      setCurrentTranscript("");
    }
  };

  const handleSubmit = async (e) => {
    try {
      setIsSubmitted(true);
      e.preventDefault();
      const response = await fetch(`${BACKEND_URL}/api/story/feedback/${sid}`, {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      console.log("Submitted feedback:", data.saveFeedbacks);
      navigate(`/dashboard/Feedback/${sid}`);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitted(false);
    }

    //alert("Great job! Your storytelling adventure has been submitted! 🌟");
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-100 to-purple-100 p-6 overflow-y-auto">
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <MoonLoader color="#003ff2" size={90} />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 transform transition-all">
            <ProgressBar current={currentQuestion} total={questions.length} />

            <QuestionCard
              question={questions[currentQuestion]}
              currentNumber={currentQuestion + 1}
              totalQuestions={questions.length}
              onReadAgain={() => speakText(questions[currentQuestion])}
            />

            <div className="mt-6">
              <RecordButton
                isRecording={isRecording}
                onRecordStart={handleRecordStart}
                onRecordEnd={handleRecordEnd}
              />
            </div>

            {currentTranscript && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{currentTranscript}</p>
                {!canProceed && (
                  <p className="text-sm text-red-500 mt-2">
                    Please provide at least 5 words in your answer.
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center mt-8">
              <NavigationButton
                isLastQuestion={currentQuestion === questions.length - 1}
                canProceed={canProceed && !isSubmitted}
                onNext={handleNext}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
