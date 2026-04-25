import { PDFParse } from 'pdf-parse';
import fs from 'fs';

async function test() {
    try {
        console.log('PDFParse type:', typeof PDFParse);
        // Create a fake dataBuffer or just see if constructor works
        const parser = new PDFParse({ data: Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Hello) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF') });
        console.log('Parser created');
        const textResult = await parser.getText();
        console.log('Text result:', textResult);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
