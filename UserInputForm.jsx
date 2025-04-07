import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CustomerService from "../services/CustomerService";

export default function UserInputForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    tableFor: "1",
  });
  const [submitted, setSubmitted] = useState(false);
  const [queueStatus, setQueueStatus] = useState("Waiting in queue...");
  const [errorMessage, setErrorMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [countdown, setCountdown] = useState(180); // 3-minute timer
  const [tableAssigned, setTableAssigned] = useState(null);

  // Simulates websocket connection to update queue status
  useEffect(() => {
    if (submitted) {
      // Timer countdown
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      // Simulate potential table assignment after random time
      const assignmentTimeout = setTimeout(() => {
        // Randomly decide if table is assigned (for demo purposes)
        if (Math.random() > 0.5) {
          setTableAssigned(Math.floor(Math.random() * 20) + 1);
        }
      }, Math.random() * 10000 + 5000);

      return () => {
        clearInterval(timer);
        clearTimeout(assignmentTimeout);
      };
    }
  }, [submitted]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      // Allow only numbers
      const numericValue = value.replace(/[^\d]/g, "");

      // Limit to 10 digits
      const truncatedValue = numericValue.slice(0, 10);

      setFormData({ ...formData, [name]: truncatedValue });

      // Validate phone number
      if (truncatedValue.length !== 0 && truncatedValue.length !== 10) {
        setPhoneError("Phone number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Reset errors

    if (!formData.name || !formData.phone || !formData.tableFor) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (formData.phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return;
    }

    try {
      const response = await CustomerService.joinQueue(formData);
      if (response) {
        setSubmitted(true);
        setQueueStatus("Waiting in queue...");
      } else {
        setErrorMessage("Failed to join queue. Please try again.");
      }
    } catch (error) {
      setErrorMessage("Error submitting. Ensure the server is running.");
    }
  };

  const handleHome = () => {
    navigate("/");
  };

  const handleJoinQueue = () => {
    navigate("/queue");
  };

  return (
    <div className="min-h-screen bg-gray-900 bg-opacity-60 backdrop-blur-lg flex flex-col">
      {/* Navigation Bar */}
      <nav className="fixed top-0 right-0 z-50 p-4 flex justify-end w-full">
        <div className="bg-black bg-opacity-70 rounded-lg shadow-lg px-6 py-2 flex space-x-6">
          <button 
            onClick={handleHome}
            className="text-white hover:text-red-400 font-medium transition-colors"
          >
            Home
          </button>
          <button 
            onClick={handleJoinQueue}
            className="text-white hover:text-red-400 font-medium transition-colors"
          >
            Join Queue
          </button>
        </div>
      </nav>

      <div className="flex-1 flex justify-center items-center pt-16">
        <div className="bg-gray-300 shadow-2xl rounded-lg p-8 w-96 relative text-center">
          <h2 className="text-xl font-semibold text-center mb-4 text-gray-800">Join the Queue</h2>

          {errorMessage && (
            <p className="text-red-500 text-center mb-3">{errorMessage}</p>
          )}

          {submitted ? (
            <div className="text-center">
              <p className="text-green-600 font-bold">Joined Queue Successfully!</p>
              {tableAssigned ? (
                <p className="mt-2 text-blue-500 font-semibold">
                  Please proceed to Table No: {tableAssigned}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-blue-500 font-semibold">{queueStatus}</p>
                  <p className="mt-2 text-red-600 font-semibold">
                    Estimated Wait: {countdown} sec
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg bg-black text-white placeholder-gray-400 shadow-md"
              />

              <div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number (10 digits)"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-black text-white placeholder-gray-400 shadow-md"
                />
                {phoneError && <p className="text-red-500 text-xs mt-1 text-left">{phoneError}</p>}
              </div>

              <input
                type="email"
                name="email"
                placeholder="Email (optional)"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg bg-black text-white placeholder-gray-400 shadow-md"
              />

              <select
                name="tableFor"
                value={formData.tableFor}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg bg-black text-white shadow-md"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{`Table for ${i + 1}`}</option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 shadow-md"
              >
                JOIN QUEUE
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
