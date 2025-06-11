import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function DailyTimeRecord() {
  const webcamRef = useRef(null);
  const [timeInData, setTimeInData] = useState(null);
  const [timeOutData, setTimeOutData] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from localStorage
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    if (!token || !role || !username) {
      navigate('/'); // Redirect to login if any required data is missing
      return;
    }

    setUserData({ token, role, username });
  }, [navigate]);

  const captureImage = () => {
    return webcamRef.current.getScreenshot();
  };

  const handleTimeIn = async () => {
    if (!userData) {
      alert("Please log in first");
      return;
    }
    const selfieIn = captureImage();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/DTR/time-in`, {
        username: userData.username,
        role: userData.role,
        selfieIn,
      }, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      setTimeInData(res.data);
      alert("Time In successful!");
    } catch (error) {
      console.error('Time In error:', error);
      if (error.response) {
        alert(`Time In failed: ${error.response.data.error || 'Unknown error'}`);
      } else {
        alert("Time In failed. Please try again.");
      }
    }
  };

  const handleTimeOut = async () => {
    if (!userData) {
      alert("Please log in first");
      return;
    }
    const selfieOut = captureImage();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/DTR/time-out`, {
        username: userData.username,
        selfieOut,
      }, {
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });
      setTimeOutData(res.data);
      alert("Time Out successful!");
    } catch (error) {
      console.error('Time Out error:', error);
      if (error.response) {
        alert(`Time Out failed: ${error.response.data.error || 'Unknown error'}`);
      } else {
        alert("Time Out failed. Please try again.");
      }
    }
  };

  if (!userData) {
    return null; // Don't render anything while checking user data
  }

  return (
    <div className="flex min-h-screen bg-red-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        <div className="p-6 space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
            <h1 className="text-2xl font-bold text-purple-800 mb-6">📅 Daily Time Record</h1>
            
            <div className="flex flex-col items-center space-y-6">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={300}
                className="rounded-lg border shadow-md"
              />

              <div className="space-x-4">
                <button 
                  onClick={handleTimeIn} 
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
                >
                  Time In
                </button>
                <button 
                  onClick={handleTimeOut} 
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
                >
                  Time Out
                </button>
              </div>

              {timeInData && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800">
                    ⏰ <strong>Time In:</strong> {timeInData.timeIn}
                  </p>
                </div>
              )}
              {timeOutData && (
                <div className="mt-2 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-800">
                    🔚 <strong>Time Out:</strong> {timeOutData.timeOut}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}