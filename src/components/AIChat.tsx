import { Button } from "@/components/ui/button";
import { Brain, Send, CheckCircle, Paperclip, Smile, Bot } from "lucide-react";
import { useState } from "react";

const AIChat = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'openai'>('gemini');

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: 'user' as const, content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel
        }),
      });

      if (response.ok) {
        // Create AI message placeholder
        const aiMessage = { role: 'assistant' as const, content: '' };
        setMessages(prev => [...prev, aiMessage]);

        try {
          // Get the response text directly instead of streaming
          const responseData = await response.json();
          
          // Update the AI message with the response
          aiMessage.content = responseData.content || 'No response content received.';
          setMessages(prev => [...prev.slice(0, -1), { ...aiMessage }]);
          
        } catch (e) {
          console.error('Error parsing response:', e);
          aiMessage.content = 'Sorry, I encountered an error processing the response.';
          setMessages(prev => [...prev.slice(0, -1), { ...aiMessage }]);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Model Selector */}
      <div className="p-4 border-b bg-gray-50 border-gray-200">
        <div className="flex items-center space-x-3">
          <Bot className="w-5 h-5 text-gray-600" />
          <label htmlFor="model-select" className="text-sm font-medium text-gray-700">
            AI Model:
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as 'gemini' | 'openai')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="gemini">🤖 Gemini AI</option>
            <option value="openai">🧠 ChatGPT</option>
          </select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Brain className="w-16 h-16 mx-auto mb-4 text-purple-300" />
            <h3 className="text-lg font-medium mb-2">
              Start chatting with {selectedModel === 'gemini' ? 'Gemini AI' : 'ChatGPT'}
            </h3>
            <p className="text-sm">
              Ask anything about sales analysis, business insights, or more
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-md">
                <div
                  className={`p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <div className={`flex items-center space-x-1 mt-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-500">
                    {message.role === 'user' ? 'You' : (selectedModel === 'gemini' ? 'Gemini AI' : 'ChatGPT')}
                  </span>
                  {message.role === 'user' && <CheckCircle className="w-3 h-3 text-blue-500" />}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-md">
              <div className="p-3 rounded-2xl bg-white border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white border-gray-200">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            <Smile className="w-5 h-5 text-gray-500" />
          </Button>
          <input
            type="text"
            placeholder={`Ask ${selectedModel === 'gemini' ? 'Gemini AI' : 'ChatGPT'} anything...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-200 text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
