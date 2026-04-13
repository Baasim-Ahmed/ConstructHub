import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EstimationResult, EstimatorState, formatCurrency } from './estimator';
import { Document } from '@prisma/client';

export const generateEstimationPDF = (result: EstimationResult, state: EstimatorState) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Project Estimation Report', pageWidth / 2, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

    // Project Details Section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Project Parameters', 14, 40);

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Project Size: ${state.areaInSqYd} sq yards`, 14, 50);
    doc.text(`Rate per Sq Yard: Rs. ${state.ratePerSqYd}`, 14, 56);
    doc.text(`Labor Cost: ${formatCurrency(state.laborCost)}`, 14, 62);
    doc.text(`Profit Margin: ${state.profitMargin}%`, 14, 68);

    // Materials Table
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Materials Breakdown', 14, 85);

    const tableData = state.materials.map(m => [
        m.name,
        formatCurrency(m.unitCost),
        m.quantity.toString(),
        formatCurrency(m.unitCost * m.quantity)
    ]);

    autoTable(doc, {
        startY: 90,
        head: [['Material', 'Unit Cost', 'Quantity', 'Total Cost']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }, // Green-600
    });

    // Final Calculation Section
    const finalY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Cost Summary', 14, finalY);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    // Right align values for better readability
    const labelX = 14;
    const valueX = 100;

    doc.text('Total Material Cost:', labelX, finalY + 10);
    doc.text(formatCurrency(result.totalMaterialCost), valueX, finalY + 10);

    doc.text('Base Cost (Labor + SqYd):', labelX, finalY + 18);
    doc.text(formatCurrency(result.baseCost), valueX, finalY + 18);

    doc.text(`Profit Amount (${state.profitMargin}%):`, labelX, finalY + 26);
    doc.text(formatCurrency(result.profitAmount), valueX, finalY + 26);

    // Final Total
    doc.setDrawColor(200, 200, 200);
    doc.line(labelX, finalY + 32, valueX + 40, finalY + 32);

    doc.setFontSize(14);
    doc.setTextColor(22, 163, 74); // Green color
    doc.setFont('helvetica', 'bold');
    doc.text('Estimated Total:', labelX, finalY + 42);
    doc.text(formatCurrency(result.finalCost), valueX, finalY + 42);

    // Range
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estimated Range: ${formatCurrency(result.minRange)} - ${formatCurrency(result.maxRange)}`, labelX, finalY + 50);

    // Save
    doc.save('estimation-report.pdf');
};

export const generateDocumentPDF = async (document: Document) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(18);
    doc.text('Document Record', pageWidth / 2, 20, { align: 'center' });

    // Metadata
    doc.setFontSize(12);
    doc.text(`Name: ${document.name}`, 14, 40);
    doc.text(`Uploaded Date: ${new Date(document.uploadedAt).toLocaleDateString()}`, 14, 50);

    // Check if image
    const isImage = document.url.match(/\.(jpeg|jpg|png)$/i);

    if (isImage) {
        try {
            // Fetch image to get base64 or blob
            // Note: This might fail if CORS is not configured on the storage bucket
            // For this implementation, we'll try to add it directly if possible, 
            // but usually we need to convert to base64 first.

            const img = new Image();
            img.src = document.url;
            img.crossOrigin = "Anonymous";

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Calculate aspect ratio to fit in page
            const imgProps = doc.getImageProperties(img);
            const pdfWidth = pageWidth - 28;
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(img, 'JPEG', 14, 60, pdfWidth, pdfHeight);
            doc.save(`${document.name}.pdf`);
        } catch (error) {
            console.error("Failed to embed image", error);
            // Fallback to link
            addLinkFallback(doc, document);
        }
    } else {
        addLinkFallback(doc, document);
    }
};

const addLinkFallback = (doc: jsPDF, document: Document) => {
    doc.setFontSize(12);
    doc.text('This document cannot be embedded directly into the PDF.', 14, 70);
    doc.text('You can access the original file using the link below:', 14, 80);

    doc.setTextColor(0, 0, 255);
    doc.textWithLink('Click here to view original file', 14, 90, { url: document.url });

    doc.save(`${document.name}.pdf`);
};
