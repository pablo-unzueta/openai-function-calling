'use client';

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  logging?: string[];
}

function AIMessage({ message }: { message: Message }) {
  const [showLogs, setShowLogs] = useState(false);

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-start space-x-2">
        <div className="max-w-3xl p-4 rounded-lg bg-gray-200">
          {message.text}
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

  return (
    <main className="flex flex-col h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">ToddGPT</h1>
      <div className="flex-grow flex flex-col bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex-grow overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
              {message.isUser ? (
                <div className="max-w-3xl p-4 rounded-lg bg-blue-500 text-white">
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
        <form onSubmit={handleSend} className="flex p-4 bg-gray-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}