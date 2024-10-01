'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  logging?: string[];
  responseTime?: number;
  imagePath?: string;  // Add this field
}

function AIMessage({ message }: { message: Message }) {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="flex flex-col space-y-2">
      {message.responseTime && (
        <div className="text-xs text-gray-500 mb-1">
          Response time: {message.responseTime}s
        </div>
      )}
      <div className="flex items-start space-x-2">
        <div className="max-w-3xl rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-200">
            {message.text}
          </div>
          {message.imagePath && (
            <div className="mt-2 bg-white p-2">
              <Image
                src={message.imagePath}
                alt="Response image"
                width={300}
                height={200}
                className="rounded-lg"
              />
            </div>
          )}
        </div>
        {message.logging && message.logging.length > 0 && (
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="text-gray-500 hover:text-gray-700 mt-2 flex-shrink-0"
          >
            {showLogs ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {showLogs && message.logging && message.logging.length > 0 && (
        <div className="ml-2 mt-2 bg-gray-100 p-2 rounded-md text-sm overflow-x-auto max-w-3xl">
          {message.logging.map((log, index) => (
            <pre key={index}>{log}</pre>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now(),
        text: input,
        isUser: true,
      };
      setMessages([...messages, userMessage]);
      setInput('');
      setHistoryIndex(-1);
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:8000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: input }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'API request failed');
        }

        const data = await response.json();
        const aiMessage: Message = {
          id: Date.now() + 1,
          text: data.response,
          isUser: false,
          logging: data.logging,
          responseTime: data.response_time,
          imagePath: data.image_path || undefined  // Use undefined if image_path is null
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
      } catch (error) {
        console.error('Error:', error);
        const errorMessage: Message = {
          id: Date.now() + 1,
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          isUser: false,
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const userMessages = messages.filter(m => m.isUser).map(m => m.text);
    
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < userMessages.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(userMessages[userMessages.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        if (newIndex === -1) {
          setInput('');
        } else {
          setInput(userMessages[userMessages.length - 1 - newIndex]);
        }
      }
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [input]);

  return (
    <main className="flex flex-col h-screen p-4 bg-white">
      <div className="flex items-center mb-4">
        <Image
          src="/images/AppIcon~ios-marketing.png"
          alt="ToddGPT Logo"
          width={40}
          height={40}
          className="mr-2 rounded-lg"  // Added rounded-lg class
        />
        <h1 className="text-4xl">ToddGPT</h1>
      </div>
      <div className="flex-grow flex flex-col bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="flex-grow overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
              {message.isUser ? (
                <div className="max-w-3xl p-4 rounded-lg bg-[#ccebc5] text-black">
                  {message.text}
                </div>
              ) : (
                <AIMessage message={message} />
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-3xl p-4 rounded-lg bg-gray-200">
                Thinking...
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSend} className="flex p-4 bg-white border-t border-gray-200">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#ccebc5]"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#ccebc5] text-black rounded-r-lg hover:bg-[#b8e0a7] focus:outline-none focus:ring-2 focus:ring-[#ccebc5] disabled:bg-gray-400"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}