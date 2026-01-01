import { Document, Packer, Paragraph, TextRun } from "docx";

const DownloadService = ({ interviewData, customQuestions, selectedQuestions, answers }) => {
  const downloadWordDocument = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun("Interviewee Name: " + interviewData.intervieweeName),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun("Interview Date: " + interviewData.date),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun("Topic: " + interviewData.topic),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun("\nCustom Questions:"),
              ],
            }),
            ...customQuestions.map((question) => {
              return new Paragraph({
                children: [
                  new TextRun(question),
                ],
              });
            }),

            new Paragraph({
              children: [
                new TextRun("\nAnswers:"),
              ],
            }),
            ...selectedQuestions.map((question) => {
              const answer = answers[question] || "";
              return new Paragraph({
                children: [
                  new TextRun(question + " - Answer: " + answer),
                ],
              });
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "interview_data.docx";
      link.click();
    });
  };

  return (
    <button
      onClick={downloadWordDocument}
      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xl sm:text-2xl ml-4"
    >
      Download Summary
    </button>
  );
};

export default DownloadService;