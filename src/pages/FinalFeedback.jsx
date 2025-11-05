import React, { useEffect } from "react";
import ReadingFeedback from "@/components/ReadingFeedback";
import { useParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function FinalFeedback() {
  const { aid } = useParams();
  const [audio, setAudio] = useState();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  
  useEffect(() => {
    const getFeedback = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/audio/finalFeedback/${aid}`, {
          withCredentials: true, // Axios uses withCredentials instead of credentials
        });
        if (response.status === 200) {
          const data = response.data; // Axios already parses JSON, use response.data
          console.log(data);
          setAudio(data);
        } else {
          console.error("Failed to fetch feedback: ", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    };
    getFeedback();
  }, [aid]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 py-12">
      <ReadingFeedback
        title={audio?.story.storyTitle}
        transcription={audio?.audio.transcript}
        transcript={audio?.audio.wholeStory}
        score={Math.round(audio?.audio.score)}
        //totalWords={150}
      />
    </div>
  );
}

export default FinalFeedback;
