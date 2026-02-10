import jsPDF from "jspdf";

export function generateCertificate(userName: string, courseName: string, completionDate: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, w, h, "F");

  // Border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, w - 20, h - 20);
  doc.rect(14, 14, w - 28, h - 28);

  // Header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(160, 160, 160);
  doc.text("CODING SOCIETY", w / 2, 35, { align: "center" });

  // Title
  doc.setFontSize(36);
  doc.setTextColor(255, 255, 255);
  doc.text("Certificate of Completion", w / 2, 55, { align: "center" });

  // Decorative line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(w / 2 - 60, 62, w / 2 + 60, 62);

  // Presented to
  doc.setFontSize(12);
  doc.setTextColor(160, 160, 160);
  doc.text("This certificate is proudly presented to", w / 2, 80, { align: "center" });

  // Name
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(userName || "Student", w / 2, 100, { align: "center" });

  // Course info
  doc.setFontSize(12);
  doc.setTextColor(160, 160, 160);
  doc.text("for successfully completing the course", w / 2, 118, { align: "center" });

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text(courseName, w / 2, 133, { align: "center" });

  // Date
  doc.setFontSize(11);
  doc.setTextColor(160, 160, 160);
  doc.text(`Completed on ${completionDate}`, w / 2, 155, { align: "center" });

  // Footer
  doc.setFontSize(9);
  doc.text("This is a digital certificate issued by Coding Society", w / 2, h - 25, { align: "center" });

  doc.save(`certificate-${courseName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
