// Netlify enforces this distributed IP/domain limit before origin processing.
// Static app assets have separate CDN delivery; a normal app-shell install is not a page burst.
import { errors, isDocumentRequest, renderHttpError } from './lib/http-errors.js';
export default async (request, context) => {
    try {
        const response=await context.next();
        if(isDocumentRequest(request)&&errors[response.status])return renderHttpError(request,response.status,{headers:response.headers});
        return response;
    } catch(error) {
        if(!isDocumentRequest(request))throw error;
        return renderHttpError(request,503);
    }
};
export const config = {
    path: '/*',
    excludedPath: [
        '/.netlify/functions/*', '/js/*', '/css/*', '/icons/*', '/logo-options/*',
        '/sw.js', '/manifest.json', '/notif.mp3', '/favicon.ico', '/__rate-limited'
    ],
    rateLimit: {
        windowLimit: 120,
        windowSize: 60,
        aggregateBy: ['domain', 'ip'],
        action: 'rewrite',
        to: '/__rate-limited'
    }
};
