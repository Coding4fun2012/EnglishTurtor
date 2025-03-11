'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
    type: string;
    message: string;
    timestamp: string;
    data?: any;
}

export function MessageCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState('Waiting for messages...');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // 设置画布大小
        function resizeCanvas() {
            const container = canvas.parentElement;
            if (container) {
                canvas.width = container.clientWidth - 40;
                canvas.height = 400;
            }
        }

        // 绘制消息
        function drawMessages() {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 清除画布
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 设置文本样式
            ctx.font = '16px monospace';
            ctx.fillStyle = '#00ff00';

            // 绘制消息
            messages.forEach((msg, index) => {
                const y = 30 + (index * 30);
                ctx.fillText(`[${msg.type}] ${msg.message}`, 20, y);

                // 绘制时间戳
                const time = new Date(msg.timestamp).toLocaleTimeString();
                ctx.fillStyle = '#666666';
                ctx.fillText(time, canvas.width - 100, y);
                ctx.fillStyle = '#00ff00';
            });
        }

        // 初始化画布大小
        resizeCanvas();
        drawMessages();

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            resizeCanvas();
            drawMessages();
        });

        // 清理函数
        return () => {
            window.removeEventListener('resize', drawMessages);
        };
    }, [messages]);

    useEffect(() => {
        // 连接 SSE
        const evtSource = new EventSource('/api/message');

        evtSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setMessages(prev => [{
                    ...data,
                    timestamp: new Date().toISOString()
                }, ...prev].slice(0, 5));

                setStatus(`Last message received at ${new Date().toLocaleTimeString()}`);
                setIsError(false);
            } catch (error) {
                console.error('Error processing message:', error);
                setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                setIsError(true);
            }
        };

        evtSource.onerror = (error) => {
            console.error('SSE Error:', error);
            setStatus('Connection error. Reconnecting...');
            setIsError(true);
        };

        // 清理函数
        return () => {
            evtSource.close();
        };
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <canvas
                ref={canvasRef}
                className="w-full h-[400px] border border-gray-200 rounded bg-[#1a1a1a]"
            />
            <div className={`mt-4 p-3 rounded ${isError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                {status}
            </div>
        </div>
    );
} 