import { useState } from "react";
import GeminiChat from "./GeminiChat";
import ChatGPTChat from "./ChatGPTChat";
import CohereChat from "./CohereChat";
import DeepAIChat from "./DeepAIChat";

const AIChatDashboard = () => {
  const [selectedAI, setSelectedAI] = useState<'gemini' | 'chatgpt' | 'cohere' | 'deepai'>('gemini');

  return (
    <div className="h-full flex flex-col">
      {/* AI Selection Toggle */}
      <div className="p-4 border-b bg-white border-gray-200">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedAI('gemini')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              selectedAI === 'gemini'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">🤖</span>
            <span>Gemini AI</span>
          </button>
          <button
            onClick={() => setSelectedAI('chatgpt')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              selectedAI === 'chatgpt'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">🧠</span>
            <span>ChatGPT</span>
          </button>
          
          <button
            onClick={() => setSelectedAI('cohere')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              selectedAI === 'cohere'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">🌟</span>
            <span>Cohere AI</span>
          </button>
          
          <button
            onClick={() => setSelectedAI('deepai')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              selectedAI === 'deepai'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">🔮</span>
            <span>DeepAI</span>
          </button>
        </div>
      </div>

      {/* Full Screen AI Chat */}
      <div className="flex-1 overflow-hidden">
        {selectedAI === 'gemini' && (
          <div className="h-full">
            <GeminiChat />
          </div>
        )}
        
        {selectedAI === 'chatgpt' && (
          <div className="h-full">
            <ChatGPTChat />
          </div>
        )}
        
        {selectedAI === 'cohere' && (
          <div className="h-full">
            <CohereChat />
          </div>
        )}
        
        {selectedAI === 'deepai' && (
          <div className="h-full">
            <DeepAIChat />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatDashboard;
