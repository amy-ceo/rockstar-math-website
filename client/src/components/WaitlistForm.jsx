import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const WaitlistForm = ({ setIsFormModalOpen }) => {
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [phonenumber, setPhonenumber] = useState("");
  const [currentgrade, setCurrentgrade] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("https://frontend-production-9912.up.railway.app/api/waitlist", {
        email,
        firstname,
        lastname,
        phonenumber,
        currentgrade,
      });

      if (response.data.success) {
        toast.success("Your request has been sent! Admin will contact you soon.");
        setIsFormModalOpen(false);
      } else {
        toast.error("Failed to send request. Try again.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 mt-14 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold text-gray-800">Join The Waitlist</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <input type="text" placeholder="First Name" required value={firstname} onChange={(e) => setFirstname(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
          <input type="text" placeholder="Last Name" required value={lastname} onChange={(e) => setLastname(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
          <input type="text" placeholder="Phone" required value={phonenumber} onChange={(e) => setPhonenumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />
          <input type="number" placeholder="Current Grade" required value={currentgrade} onChange={(e) => setCurrentgrade(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg" />

          <button type="submit" className="w-full bg-deepBlue text-white py-2 mt-4 rounded-lg hover:bg-sky-600">
            Submit
          </button>
             <button
                onClick={() => setIsFormModalOpen(false)}
                className="w-full mt-2 text-gray-600 underline text-sm"
              >
                Cancel
              </button>
        </form>
      </div>
    </div>
  );
};

export default WaitlistForm;
