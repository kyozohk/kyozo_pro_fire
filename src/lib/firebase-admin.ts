
import * as admin from 'firebase-admin';

// Hardcoded service account for debugging purposes.
const serviceAccount = {
  "type": "service_account",
  "project_id": "kyozo-pro-webflow-fb6cc",
  "private_key_id": "d6854bfc05cc7be4db94cd8a90e1e42ff29909da",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqvzGe7duqPU0v\nZGaUWmYFWDjXc1KxfDYMBPeYs5jrWxoR/2a5Uh+FgEeRMLd680S3JwTWWu4fwDWq\nG47ZYeXggs9F/HfCDBBqmN1XqOVrcw94/ZMAWxikKbvCX0fApcN8F1nu76J7exrw\nkbID6nAN/iubS8qZAffK6RGyYVTXUDLbjqFSV73J3Oh+YjDj+A/LluKc+i7aDmCZ\nptFN1oxE56M/OJFOwLB4D8pQ4GJ8N8U8qtP/vGl9h/5ZntQ787iHRskAuimdP4fX\nvr4PsLnw1glhVfQdCSDmU4nA8QRZXFJCZgEYkbwMCy9ySkuv2qKgWZTnohrdMMgC\nI5GdTgnBAgMBAAECggEAAIe1HkMq2YQc5NPeAIm4r41f6Q2UYw0do/c5m3CKjefB\nqJ7VV1fDpbn9kuQazDm0T9Eh+f5Ely41HnHtJUQxQvuF/Cer2aMo44NVq9aYLn+Q\nG6QWJlgKDzOq18hM4kKDfTOLe7ckTwfFeEvsAIiMNDNq6E2tl4C0x7VGOQKFyWC2\n2ChsqMsNdvv2x0bkbmygKWHdejwGtkBt22lS22Q9Te4zpcoFoUJ5oTGquv8Q2iD0\n6bGNPdF7SR4kjagcXH7wYt9YnkpxFncHBhi5eyHP5DnhGF91OkJtwLtsaukAdBZU\noVkLT+YcjlBF2By7ve4U9nYrhgbVyWlsv07e1MWoYQKBgQDfLP6CLNQbrkpQFO5v\nh4ipcbT/YKHBNwKb1xzHq+a0Jgu8dn5grl1tZdRsa1unA7vuqls5erfZnE+/wVJW\nIzZLPVxTYX00xCyskun4yfWwDQ8QPGj7DQzM1I94Hkpgp6YaYC/p3TuojGOvXDnm\n1aNykx5aFnkOaUtoGao8RqXLoQKBgQDD3CX09awzEQHPbeqMZPlgcYSk8tDjPdIw\nJEDN35+f6vONJnvu7O0Dtq4dA018CqxN6NDicEqxVRn9gCXH63X6IJ1eSpbfVyPH\nBXPVJAUpsHr11rvbLrFpc+DlsL/lXIGInXXcK0XG2A9qhvd0BS0PhS5aJFayGoj5\nOxcjYeqKIQKBgQDADepff9BwmcZdsAWYeNxEZRPLiQ7qRTq7fZzIv8fjU7JZ1ube\nsG66DB2Hx8OxsGbz9ipXBqJcZEXE0MrYUakRipZ/MrAazo9bW3p5nOMPQ82ovTPi\nh9JyGqH0TqzXDK7Gl+vjp30FiProF8fEPClSGgTOpfQ7UKWRyjRTdsCKwQKBgCGY\nHCaVEPE9ZIsYtldYZnHFZtQIFg40J148iaUGS1HZseavCCjmGI0/g0PUsjCpf/5p\nBZMhYZ5jE28o0NImr/i0KWnn71LllmxnogOYBw6sh5qtN1GUA7gruRKMq42CvXEa\nWQHnpjNCEfrapY0P6je0R0wM2ZX4+S+OlBxsihchAoGAfKQArlvOTULxkiq99bcO\nWG7dHZ6ETJAtSZXdsrUs987LI0tawx5XPqqpeJJ4wZ62YR7tiHWN9ZmR1ZOENAPk\n7mXCxi3h06glwZdjMcOC5iQeQ6TyyKFnCPLTsWsjpthoYr7v/tH2YqyzehP6/Dl9\nCwTFJ6QkMgBFaPJ+FDgrRug=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-fbsvc@kyozo-pro-webflow-fb6cc.iam.gserviceaccount.com",
  "client_id": "112937285154876286789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40kyozo-pro-webflow-fb6cc.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

let adminApp: admin.app.App;

export function getFirebaseAdminApp(): admin.app.App {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    return adminApp;
}
