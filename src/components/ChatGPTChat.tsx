import { Button } from "@/components/ui/button";
import { Bot, Send, CheckCircle, Paperclip, Smile } from "lucide-react";
import { useState } from "react";

const ChatGPTChat = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          model: 'openai'
        }),
      });

      if (response.ok) {
        try {
          // Get the response text directly instead of streaming
          const responseData = await response.json();
          
          // Create the AI message with the response
          const aiMessage = { 
            role: 'assistant' as const, 
            content: responseData.response || 'No response content received.' 
          };
          setMessages(prev => [...prev, aiMessage]);
          
        } catch (e) {
          console.error('Error parsing response:', e);
          const errorMessage = { 
            role: 'assistant' as const, 
            content: 'Sorry, I encountered an error processing the response.' 
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try Gemini.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
      {/* ChatGPT Header */}
      <div className="p-4 border-b bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="flex items-center space-x-3">
          <Bot className="w-8 h-8 text-green-200" />
          <div>
            <h2 className="text-xl font-bold">ChatGPT Assistant</h2>
            <p className="text-sm text-green-200">Powered by OpenAI GPT</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bot className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h3 className="text-lg font-medium mb-2 text-green-700">
              Start chatting with ChatGPT wiht your sales data!
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
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-green-200 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <div className={`flex items-center space-x-1 mt-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-500">
                    {message.role === 'user' ? 'You' : 'ChatGPT'}
                  </span>
                  {message.role === 'user' && <CheckCircle className="w-3 h-3 text-green-500" />}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-md">
              <div className="p-3 rounded-2xl bg-white border border-green-200 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white border-green-200">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="hover:bg-green-100">
            <Paperclip className="w-5 h-5 text-green-500" />
          </Button>
          <Button variant="ghost" size="icon" className="hover:bg-green-100">
            <Smile className="w-5 h-5 text-green-500" />
          </Button>
          <input
            type="text"
            placeholder="Ask ChatGPT anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent border-green-200 text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatGPTChat;
