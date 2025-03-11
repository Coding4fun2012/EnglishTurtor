import type { APIRoute } from 'astro';

let clients = new Set<ReadableStreamDefaultController>();

// 添加 CORS 头部
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, User-Agent',
};

export const GET: APIRoute = async ({ request }) => {
    const stream = new ReadableStream({
        start(controller) {
            clients.add(controller);
            request.signal.addEventListener('abort', () => {
                clients.delete(controller);
            });
        }
    });

    return new Response(stream, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
};

// 处理 OPTIONS 请求
export const OPTIONS: APIRoute = async () => {
    return new Response(null, {
        status: 204,
        headers: corsHeaders
    });
};

export const POST: APIRoute = async ({ request }) => {
    try {
        // 打印完整的请求信息
        console.log('\n=== 收到新请求 ===');
        console.log('Method:', request.method);
        console.log('URL:', request.url);

        // 获取并打印所有请求头
        const headersObj = {};
        request.headers.forEach((value, key) => {
            headersObj[key.toLowerCase()] = value;
        });
        console.log('Headers:', JSON.stringify(headersObj, null, 2));

        // 检查 Content-Type
        const contentType = headersObj['content-type'];
        console.log('Content-Type:', contentType);

        if (!contentType || !contentType.includes('application/json')) {
            return new Response(JSON.stringify({
                error: 'Content-Type must be application/json',
                received: contentType || 'no content type',
                headers: headersObj
            }, null, 2), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        // 读取请求体
        const text = await request.text();
        console.log('Request body:', text);

        if (!text) {
            return new Response(JSON.stringify({
                error: 'Request body is empty'
            }, null, 2), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        // 解析 JSON
        const data = JSON.parse(text);
        console.log('Parsed data:', JSON.stringify(data, null, 2));

        if (!data.type || !data.message) {
            return new Response(JSON.stringify({
                error: 'Invalid message format. Required fields: type, message',
                received: data
            }, null, 2), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        // 广播消息
        const message = JSON.stringify(data);
        clients.forEach(client => {
            client.enqueue(`data: ${message}\n\n`);
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Message broadcasted successfully',
            clientCount: clients.size
        }, null, 2), {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('Error processing request:', error);
        return new Response(JSON.stringify({
            error: 'Invalid JSON format',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, null, 2), {
            status: 400,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            }
        });
    }
}; 