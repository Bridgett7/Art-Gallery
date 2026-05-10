package com.metamuse.service;

import com.metamuse.model.Order;
import com.metamuse.model.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {

    @Value("${app.invoice.output-dir:./invoices}")
    private String invoiceOutputDir;

    /**
     * Generate a PDF invoice for an order. Returns the file path.
     */
    public String generateInvoice(Order order) {
        try {
            Path dir = Paths.get(invoiceOutputDir);
            Files.createDirectories(dir);

            String invoiceNumber = generateInvoiceNumber(order);
            String filename = invoiceNumber + ".pdf";
            File outputFile = dir.resolve(filename).toFile();

            generatePdf(order, invoiceNumber, outputFile);

            log.info("Invoice generated: {}", filename);
            return filename;
        } catch (Exception e) {
            log.error("Failed to generate invoice for order {}: {}", order.getId(), e.getMessage());
            throw new RuntimeException("Invoice generation failed", e);
        }
    }

    /**
     * Get the invoice file for download.
     */
    public File getInvoiceFile(String filename) {
        File file = Paths.get(invoiceOutputDir, filename).toFile();
        if (!file.exists()) {
            throw new RuntimeException("Invoice not found: " + filename);
        }
        return file;
    }

    /**
     * Get invoice filename for an order.
     */
    public String getInvoiceFilename(Order order) {
        return generateInvoiceNumber(order) + ".pdf";
    }

    /**
     * Check if invoice exists for an order.
     */
    public boolean invoiceExists(Order order) {
        String filename = getInvoiceFilename(order);
        return Paths.get(invoiceOutputDir, filename).toFile().exists();
    }

    private void generatePdf(Order order, String invoiceNumber, File outputFile) throws Exception {
        try (var writer = new com.itextpdf.kernel.pdf.PdfWriter(outputFile);
             var pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
             var document = new com.itextpdf.layout.Document(pdf)) {

            // Header
            document.add(new com.itextpdf.layout.element.Paragraph("METAMUSE - INVOICE")
                    .setFontSize(20).setBold());
            document.add(new com.itextpdf.layout.element.Paragraph("Invoice: " + invoiceNumber));
            document.add(new com.itextpdf.layout.element.Paragraph("Date: " + LocalDate.now().format(DateTimeFormatter.ISO_DATE)));
            document.add(new com.itextpdf.layout.element.Paragraph("Customer: " +
                    (order.getUser() != null ? order.getUser().getUsername() : "N/A")));
            document.add(new com.itextpdf.layout.element.Paragraph("Delivery: " +
                    (order.getDeliveryLocation() != null ? order.getDeliveryLocation() : "N/A")));
            document.add(new com.itextpdf.layout.element.Paragraph(" "));

            // Items table
            float[] columnWidths = {3, 1, 1, 1};
            var table = new com.itextpdf.layout.element.Table(columnWidths);
            table.addHeaderCell("Product");
            table.addHeaderCell("Qty");
            table.addHeaderCell("Price");
            table.addHeaderCell("Total");

            double grandTotal = 0;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    String productName = item.getProduct() != null ? item.getProduct().getName() : "Unknown";
                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    double price = item.getProduct() != null && item.getProduct().getPrice() != null
                            ? item.getProduct().getPrice() : 0;
                    double total = price * qty;
                    grandTotal += total;

                    table.addCell(productName);
                    table.addCell(String.valueOf(qty));
                    table.addCell(String.format("%.2f DT", price));
                    table.addCell(String.format("%.2f DT", total));
                }
            }

            document.add(table);
            document.add(new com.itextpdf.layout.element.Paragraph(" "));
            document.add(new com.itextpdf.layout.element.Paragraph("TOTAL: " + String.format("%.2f DT", grandTotal))
                    .setFontSize(14).setBold());
        }
    }

    private String generateInvoiceNumber(Order order) {
        return String.format("INV-%d-%05d", LocalDate.now().getYear(), order.getId());
    }
}
