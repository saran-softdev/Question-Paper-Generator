import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { XCircleIcon } from "@heroicons/react/20/solid";

const Home = () => {
  const [formData, setFormData] = useState({
    collegeName: "SRM INSTITUTE OF SCIENCE AND TECHNOLOGY",
    department:
      "FACULTY OF SCIENCE AND HUMANITIES\nDEPARTMENT OF COMPUTER APPLICATIONS",
    testName: "",
    courseCode: "",
    courseTitle: "",
    className: "",
    maxMarks: "",
    parts: []
  });
  const [errors, setErrors] = useState({});
  const [pages, setPages] = useState([[]]); // Initialize with one empty page
  console.log("Global Pages: " + pages);
  const navigate = useNavigate();
  const [currentPart, setCurrentPart] = useState({
    partName: "",
    marksPerQuestion: 0,
    maxQuestions: 0,
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    bl: "",
    co: "",
    po: ""
  });
  const [currentAltQuestion, setCurrentAltQuestion] = useState({
    text: "",
    bl: "",
    co: "",
    po: ""
  });
  const [isEitherOr, setIsEitherOr] = useState(false); // Toggle for either-or questions

  const [editingIndex, setEditingIndex] = useState(null);
  const pdfRef = useRef();

  useEffect(() => {
    // Check if the auth token is missing
    if (!localStorage.getItem("authToken")) {
      navigate("/"); // Redirect to sign-in if token is not found
    }
  }, [navigate]);
  const logout = () => {
    localStorage.removeItem("authToken");
    window.location.reload(); // Optionally, reload to redirect the user to the login page
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddPart = () => {
    const newErrors = {};

    if (formData.testName === "") newErrors.testName = "Test name is required.";
    if (formData.courseCode === "")
      newErrors.courseCode = "Course code is required.";
    if (formData.courseTitle === "")
      newErrors.courseTitle = "Course title is required.";
    if (formData.className === "")
      newErrors.className = "Class name is required.";
    if (formData.maxMarks === "") newErrors.maxMarks = "Max marks is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setFormData({
      ...formData,
      parts: [...formData.parts, { ...currentPart, questions: [] }]
    });
    setCurrentPart({
      partName: "",
      marksPerQuestion: 0,
      maxQuestions: 0,
      questions: []
    });
  };

  const handleAddOrUpdateQuestion = (partIndex) => {
    const newParts = formData.parts.map((part) => ({
      ...part,
      questions: [...part.questions]
    }));

    if (editingIndex !== null) {
      newParts[partIndex].questions[editingIndex] = currentQuestion;

      if (currentAltQuestion.text) {
        newParts[partIndex].questions[editingIndex] = {
          primary: currentQuestion,
          alternate: currentAltQuestion,
          isEitherOr: true
        };
      }

      setEditingIndex(null);
    } else {
      if (isEitherOr && currentAltQuestion.text) {
        // Add either-or question as a pair
        newParts[partIndex].questions.push({
          primary: currentQuestion,
          alternate: currentAltQuestion,
          isEitherOr: true
        });
      } else {
        // Add regular question
        newParts[partIndex].questions.push(currentQuestion);
      }
    }

    setFormData({ ...formData, parts: newParts });
    setCurrentQuestion({ text: "", bl: "", co: "", po: "" });
    setCurrentAltQuestion({ text: "", bl: "", co: "", po: "" });
    setIsEitherOr(false);
  };

  const handleQuestionChange = (e, isAlt = false) => {
    const { name, value } = e.target;
    if (isAlt) {
      setCurrentAltQuestion({ ...currentAltQuestion, [name]: value });
    } else {
      setCurrentQuestion({ ...currentQuestion, [name]: value });
    }
  };

  const handleEditQuestion = (partIndex, qIndex) => {
    const questionToEdit = formData.parts[partIndex].questions[qIndex];

    if (questionToEdit.isEitherOr) {
      setCurrentQuestion(questionToEdit.primary);
      setCurrentAltQuestion(questionToEdit.alternate);
      setIsEitherOr(true);
    } else {
      setCurrentQuestion(questionToEdit);
      setCurrentAltQuestion({ text: "", bl: "", co: "", po: "" }); // Reset alternate question
      setIsEitherOr(false);
    }

    setEditingIndex(qIndex);
  };

  const handleDeleteQuestion = (partIndex, qIndex) => {
    const newParts = [...formData.parts];
    newParts[partIndex].questions.splice(qIndex, 1);
    setFormData({ ...formData, parts: newParts });
  };

  const handleNewPage = () => {
    // Add a new page
    setPages([...pages, []]);
  };

  const downloadPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const promises = pages.map((_, pageIndex) => {
      const pageElement = document.getElementById(`page-${pageIndex}`);
      return html2canvas(pageElement).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        if (pageIndex === 0) {
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
        } else {
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
        }
      });
    });

    Promise.all(promises).then(() => {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(12);
        pdf.text("***** ALL THE BEST *****", pdfWidth / 2, pdfHeight - 10, {
          align: "center"
        });
      }

      pdf.save(`${formData.testName}_Question_Paper.pdf`);
    });
  };

  const splitIntoPages = (parts) => {
    const pages = [];
    console.log("splitInto + Pages", pages);

    let currentPage = [];
    let currentPageHeight = 0;
    const maxPageHeight = 1123; // A4 page height in pixels
    const threshold = maxPageHeight - 100;

    const partContainer = document.createElement("div");
    partContainer.style.position = "absolute";
    partContainer.style.visibility = "hidden";
    document.body.appendChild(partContainer);

    parts.forEach((part) => {
      const partElement = document.createElement("div");
      partElement.innerHTML = `
        <h2>${part.partName}</h2>
        <p>
          Answer any <strong>${part.maxQuestions}</strong> Questions
          <span>
            <strong>
              ${part.marksPerQuestion} × ${part.maxQuestions} = 
              ${part.marksPerQuestion * part.maxQuestions} Marks
            </strong>
          </span>
        </p>
      `;
      partContainer.appendChild(partElement);

      const partHeaderHeight = partElement.getBoundingClientRect().height;
      let currentPartHeight = partHeaderHeight;
      let questionHeights = [];

      part.questions.forEach((question) => {
        const questionElement = document.createElement("div");
        questionElement.innerHTML = `<p>${question}</p>`;
        partContainer.appendChild(questionElement);

        const questionHeight = questionElement.getBoundingClientRect().height;
        questionHeights.push(questionHeight);
      });

      let currentQuestions = [];
      let remainingQuestions = [];
      let remainingHeaderHeight = partHeaderHeight;

      for (let i = 0; i < questionHeights.length; i++) {
        const totalHeight =
          currentPageHeight + currentPartHeight + questionHeights[i];

        if (totalHeight > threshold) {
          remainingQuestions = part.questions.slice(i);
          break;
        }

        currentQuestions.push(part.questions[i]);
        currentPartHeight += questionHeights[i];
      }

      if (currentPageHeight + currentPartHeight > threshold) {
        pages.push([...currentPage]);
        currentPage = [];
        currentPageHeight = 0;
      }

      currentPage.push({ ...part, questions: currentQuestions });
      currentPageHeight += currentPartHeight;

      if (remainingQuestions.length > 0) {
        if (currentPage.length > 0) {
          pages.push([...currentPage]);
        }
        currentPage = [{ ...part, questions: remainingQuestions }];
        currentPageHeight =
          remainingHeaderHeight +
          remainingQuestions.reduce(
            (sum, q, idx) => sum + questionHeights[idx],
            0
          );
      }
    });

    document.body.removeChild(partContainer);

    if (currentPage.length) {
      pages.push(currentPage);
    }

    return pages;
  };

  // Inside the component
  useEffect(() => {
    // Update pages whenever formData.parts changes
    const updatedPages = splitIntoPages(formData.parts);
    setPages(updatedPages);
  }, [formData.parts]);

  let questionNumber = 1;
  return (
    <div className="p-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-blue-900 mb-12 drop-shadow-lg">
        Question Paper Generator
      </h1>
      {/* Logout Button */}
      <button
        onClick={logout}
        className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200 shadow-md"
      >
        Logout
      </button>

      {Object.keys(errors).length > 0 && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon
                aria-hidden="true"
                className="h-5 w-5 text-red-400"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                There were errors with your submission:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul role="list" className="list-disc space-y-1 pl-5">
                  {errors.testName && <li>{errors.testName}</li>}
                  {errors.courseCode && <li>{errors.courseCode}</li>}
                  {errors.courseTitle && <li>{errors.courseTitle}</li>}
                  {errors.className && <li>{errors.className}</li>}
                  {errors.maxMarks && <li>{errors.maxMarks}</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
        {["testName", "courseCode", "courseTitle", "className", "maxMarks"].map(
          (field) => (
            <div key={field} className="flex flex-col flex-grow">
              <label
                htmlFor={field}
                className="mb-2 text-lg font-semibold text-gray-700"
              >
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              <input
                id={field}
                type={field === "maxMarks" ? "number" : "text"}
                name={field}
                placeholder={`Enter ${field.replace(/([A-Z])/g, " $1")}`}
                value={formData[field]}
                onChange={handleInputChange}
                className="p-4 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 hover:shadow-lg"
              />
            </div>
          )
        )}

        <div className="flex flex-col flex-grow">
          <label className="mb-1 text-sm font-medium text-gray-700">
            Part Name
          </label>
          <input
            type="text"
            placeholder="e.g., Part A"
            value={currentPart.partName}
            onChange={(e) =>
              setCurrentPart({ ...currentPart, partName: e.target.value })
            }
            className="p-4 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 hover:shadow-lg"
          />
        </div>

        <div className="flex flex-col flex-grow">
          <label className="mb-1 text-sm font-medium text-gray-700">
            Marks per Question
          </label>
          <input
            type="number"
            placeholder="Marks"
            value={currentPart.marksPerQuestion}
            onChange={(e) =>
              setCurrentPart({
                ...currentPart,
                marksPerQuestion: parseInt(e.target.value)
              })
            }
            className="p-4 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 hover:shadow-lg"
          />
        </div>

        <div className="flex flex-col flex-grow">
          <label className="mb-1 text-sm font-medium text-gray-700">
            Max Questions
          </label>
          <input
            type="number"
            placeholder="Questions"
            value={currentPart.maxQuestions}
            onChange={(e) =>
              setCurrentPart({
                ...currentPart,
                maxQuestions: parseInt(e.target.value)
              })
            }
            className="p-4 border rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 hover:shadow-lg"
          />
        </div>

        <div className="flex items-center justify-end w-full mt-4">
          <button
            onClick={handleAddPart}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200 shadow-md"
          >
            Add Part
          </button>
        </div>
      </div>

      {/* Render question parts */}
      {formData.parts.map((part, partIndex) => (
        <div key={partIndex} className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            {part.partName}
          </h2>
          <p className="text-gray-600 mb-4">
            Answer any <strong>{part.maxQuestions}</strong> Questions{" "}
            <span className="ml-4">
              <strong>
                {part.marksPerQuestion} × {part.maxQuestions} ={" "}
                {part.marksPerQuestion * part.maxQuestions} Marks
              </strong>
            </span>
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
            <input
              type="text"
              placeholder="Enter Question"
              name="text"
              value={currentQuestion.text}
              onChange={(e) => handleQuestionChange(e)}
              className="flex-1 p-2 border rounded"
            />
            <input
              type="text"
              placeholder="BL"
              name="bl"
              value={currentQuestion.bl}
              onChange={(e) => handleQuestionChange(e)}
              className="w-full sm:w-24 p-2 border rounded"
            />
            <input
              type="text"
              placeholder="CO"
              name="co"
              value={currentQuestion.co}
              onChange={(e) => handleQuestionChange(e)}
              className="w-full sm:w-24 p-2 border rounded"
            />
            <input
              type="text"
              placeholder="PO"
              name="po"
              value={currentQuestion.po}
              onChange={(e) => handleQuestionChange(e)}
              className="w-full sm:w-24 p-2 border rounded"
            />

            {isEitherOr && (
              <>
                <input
                  type="text"
                  placeholder="Enter Alternate Question"
                  name="text"
                  value={currentAltQuestion.text}
                  onChange={(e) => handleQuestionChange(e, true)}
                  className="flex-1 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="BL"
                  name="bl"
                  value={currentAltQuestion.bl}
                  onChange={(e) => handleQuestionChange(e, true)}
                  className="w-full sm:w-24 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="CO"
                  name="co"
                  value={currentAltQuestion.co}
                  onChange={(e) => handleQuestionChange(e, true)}
                  className="w-full sm:w-24 p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="PO"
                  name="po"
                  value={currentAltQuestion.po}
                  onChange={(e) => handleQuestionChange(e, true)}
                  className="w-full sm:w-24 p-2 border rounded"
                />
              </>
            )}

            <button
              onClick={() => handleAddOrUpdateQuestion(partIndex)}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 shadow-md hover:shadow-lg"
            >
              {editingIndex !== null ? "Update Question" : "Add Question"}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <label htmlFor="eitherOrToggle" className="text-gray-700">
              Add as Either/Or Question
            </label>
            <input
              type="checkbox"
              id="eitherOrToggle"
              checked={isEitherOr}
              onChange={() => setIsEitherOr(!isEitherOr)}
              className="w-5 h-5 text-green-500 focus:ring-green-500 rounded"
            />
          </div>

          <ol className="list-decimal ml-6 space-y-2">
            {part.questions.map((q, qIndex) => (
              <li
                key={qIndex}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2"
              >
                <span className="flex-1">
                  {qIndex + 1}. {q.text} (BL: {q.bl}, CO: {q.co}, PO: {q.po})
                </span>

                <div className="flex gap-2 mt-2 sm:mt-0">
                  <button
                    onClick={() => handleEditQuestion(partIndex, qIndex)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(partIndex, qIndex)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}

      {/* New Page button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleNewPage}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-200 shadow-md"
        >
          Add New Page
        </button>
      </div>

      {/* Render each page */}
      {pages.map((page, pageIndex) => (
        <div
          key={pageIndex}
          id={`page-${pageIndex}`}
          ref={pdfRef}
          className="mx-auto bg-white rounded-lg shadow-lg p-20 mb-10 relative"
          style={{ width: "794px", height: "1123px" }}
        >
          {pageIndex === 0 && (
            <>
              <h1 className="text-xl font-extrabold text-center mb-2">
                {formData.collegeName}
              </h1>
              <p className="text-center whitespace-pre-line mb-6">
                {formData.department}
              </p>

              <h2 className="text-xl font-extrabold text-center mb-2 underline">
                {formData.testName}
              </h2>

              <div className="text-center font-semibold text-lg mb-2">
                <p>
                  <span className="font-bold">{formData.courseCode}</span> –{" "}
                  {formData.courseTitle}
                </p>
              </div>

              <div className="flex justify-between items-center text-lg font-semibold mb-4">
                <p>CLASS : {formData.className}</p>
                <p>MAX. MARKS : {formData.maxMarks}</p>
              </div>
            </>
          )}
          {page.map((part, index) => (
            <div key={index} className="mt-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">{part.partName}</h2>
                <p className="text-gray-600">
                  Answer any <strong>{part.maxQuestions}</strong> Questions
                </p>
                <p className="text-gray-600">
                  <strong>
                    {part.maxQuestions} × {part.marksPerQuestion} ={" "}
                    {part.marksPerQuestion * part.maxQuestions} Marks
                  </strong>
                </p>
              </div>

              {/* BL, CO, PO Header */}
              <div className="flex justify-between mb-2 font-bold">
                <span className="w-3/4">Questions</span>
                <div className="flex w-1/4 justify-between">
                  <span>BL</span>
                  <span>CO</span>
                  <span>PO</span>
                </div>
              </div>
              <div>
                {part.questions.map((q, qIndex) => {
                  const currentNumber = questionNumber; // Store the current question number for display

                  // Increment the question number after deciding the content
                  questionNumber++;

                  return (
                    <div
                      key={qIndex}
                      className="mb-4 flex justify-between items-start flex-col"
                    >
                      {q.isEitherOr ? (
                        <>
                          <div className="flex justify-between w-full">
                            <p>
                              <span className="font-bold">
                                {currentNumber}) A.{" "}
                              </span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: q.primary.text
                                }}
                              />
                            </p>
                            <div className="flex w-1/4 justify-between font-bold text-right">
                              <span>{q.primary.bl}</span>
                              <span>{q.primary.co}</span>
                              <span>{q.primary.po}</span>
                            </div>
                          </div>

                          {/* Centered "OR" */}
                          <div className="w-full text-center font-bold my-2">
                            OR
                          </div>

                          <div className="flex justify-between w-full">
                            <p>
                              <span className="font-bold">
                                {currentNumber}) B.{" "}
                              </span>
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: q.alternate.text
                                }}
                              />
                            </p>
                            <div className="flex w-1/4 justify-between font-bold text-right">
                              <span>{q.alternate.bl}</span>
                              <span>{q.alternate.co}</span>
                              <span>{q.alternate.po}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between w-full">
                          <p>
                            <span className="font-bold">{currentNumber}. </span>
                            <span
                              dangerouslySetInnerHTML={{ __html: q.text }}
                            />
                          </p>
                          <div className="flex w-1/4 justify-between font-bold text-right">
                            <span>{q.bl}</span>
                            <span>{q.co}</span>
                            <span>{q.po}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-4 text-gray-500">
            Page {pageIndex + 1}
          </div>
        </div>
      ))}

      <button
        onClick={downloadPDF}
        className="mt-8 bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition duration-200 shadow-md hover:shadow-lg"
      >
        Download as PDF
      </button>
    </div>
  );
};

export default Home;
