import { useState } from 'react'
import { FaMinus, FaPlus } from "react-icons/fa6";

function FAQQuestion() {
    const [openFAQs, setOpenFAQs] = useState(Array(6).fill(false));

    const toggleFAQ = (index) => {
        setOpenFAQs((prev) =>
            prev.map((item, i) => (i === index ? !item : item))
        );
    };
    return (
        <div className="bg-gray-50 text-gray-800">
        <div className="max-w-3xl mx-auto py-16 px-6 lg:px-8">
            {/* Section Header */}
            <h1 className="text-4xl font-bold text-center mb-4">
                Frequently Asked Questions
            </h1>
            <p className="text-center text-lg text-gray-600 mb-8">
                Everything you need to know about the product and billing.
            </p>
    
            {/* FAQ Items */}
            <div className="space-y-2">
                {[
                    {
                        question: "Who are these video lessons for?",
                        answer:
                            "Every student holds the potential for success. With tailored support and resources, that potential becomes reality.",
                    },
                    {
                        question: "What makes Rockstarmath different? How do I know it will help me?",
                        answer:
                            "Rockstarmath offers personalized support and resources to ensure your success.",
                    },
                    {
                        question: "Will Rockstarmath follow my coursework?",
                        answer:
                            "Yes, Rockstarmath is designed to align with your coursework and help you succeed.",
                    },
                    {
                        question: "How do the Monthly and Yearly membership plans work?",
                        answer:
                            "Membership plans offer flexible options to suit your needs, with both monthly and yearly subscriptions available.",
                    },
                    {
                        question: "Why should I trust you?",
                        answer:
                            "We have a proven track record of helping students succeed with our tailored resources and support.",
                    },
                ].map((faq, index) => (
                    <div key={index} className="border-b  p-4  ">
                        <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => toggleFAQ(index)}
                        >
                            <h2 className="text-lg font-medium">{faq.question}</h2>
                           <div className='border border-sky-600 p-1 rounded-full'>
                           <span className="text-sky-600 text-md">
                                {openFAQs[index] ? <FaMinus /> : <FaPlus />}
                            </span>
                           </div>
                        </div>
                        <div
                            className={`mt-3 text-gray-600 text-sm transition-all duration-300 ease-in-out overflow-hidden ${
                                openFAQs[index] ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                            }`}
                        >
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    
        {/* Additional CTA Section */}
        <div className="bg-gray-100 mt-12 py-16 px-6 lg:px-12 rounded-lg">
            <div className="max-w-xl mx-auto text-center">
                <div className="flex justify-center mb-6">
                    <img
                        alt="Person 1"
                        className="w-12 h-12 rounded-full border-2 border-white -ml-2"
                        src="/images/p2.png"
                    />
                    <img
                        alt="Person 2"
                        className="w-12 h-12 rounded-full border-2 border-white -ml-2"
                        src="/images/p1.png"
                    />
                    <img
                        alt="Person 3"
                        className="w-12 h-12 rounded-full border-2 border-white -ml-2"
                        src="/images/p3.png"
                    />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Still have questions?</h2>
                <p className="text-gray-600 mb-4">
                    Can’t find the answer you’re looking for? Please chat to our friendly team.
                </p>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full shadow-md transition duration-300">
                    Get in Touch
                </button>
            </div>
        </div>
    </div>
    )
}

export default FAQQuestion