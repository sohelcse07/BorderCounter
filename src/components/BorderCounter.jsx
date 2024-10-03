import React, { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import { MdOutlineSettingsVoice } from "react-icons/md";

function BorderCounter() {
    const [borders, setBorders] = useState([]);
    const [filter, setFilter] = useState("all");
    const [activeCount, setActiveCount] = useState(0);
    const [inactiveCount, setInactiveCount] = useState(0);
    const [tarikh, setTarikh] = useState("");
    const [manager, setManager] = useState("");
    const [netMeal, setNetMeal] = useState("");
    const [bazarKari, setBazarKari] = useState("");
    const [newName, setNewName] = useState("");
    const [tokenBuyer, setTokenBuyer] = useState("");
    const [isTokenInputVisible, setIsTokenInputVisible] = useState(false);
    const tableRef = useRef();

    useEffect(() => {
        const storedBorders = JSON.parse(localStorage.getItem("borders"));
        const storedFormData = JSON.parse(localStorage.getItem("formData"));

        if (storedBorders && storedBorders.length > 0) {
            setBorders(storedBorders);
            updateCounts(storedBorders);
        } else {
            const initialBorders = Array.from({ length: 160 }, (_, index) => ({
                number: index + 1,
                name: "",
                status: "inactive",
            }));
            setBorders(initialBorders);
            localStorage.setItem("borders", JSON.stringify(initialBorders));
            setInactiveCount(160);
        }

        if (storedFormData) {
            setTarikh(storedFormData.tarikh);
            setManager(storedFormData.manager);
            setNetMeal(storedFormData.netMeal);
            setBazarKari(storedFormData.bazarKari);
        }
    }, []);

    useEffect(() => {
        if (borders.length > 0) {
            localStorage.setItem("borders", JSON.stringify(borders));
            updateCounts(borders);
        }
    }, [borders]);

    useEffect(() => {
        const formData = { tarikh, manager, netMeal, bazarKari };
        localStorage.setItem("formData", JSON.stringify(formData));
    }, [tarikh, manager, netMeal, bazarKari]);

    const updateCounts = (bordersList) => {
        setActiveCount(bordersList.filter(border => border.status === "active").length);
        setInactiveCount(bordersList.filter(border => border.status === "inactive").length);
    };

    const toggleBorderStatus = (number) => {
        setBorders((prevBorders) => {
            return prevBorders.map((border) =>
                border.number === number
                    ? {
                        ...border,
                        status: border.status === "active" ? "inactive" : "active",
                    }
                    : border
            );
        });
    };

    const filteredBorders = borders.filter((border) =>
        filter === "all" ? true : border.status === filter
    );

    const activeBorders = borders.filter((border) => border.status === "active");
    
    const maxBordersPerPage = 52; // Set max borders per page
    const numPages = Math.ceil(activeBorders.length / maxBordersPerPage);
    const pages = Array.from({ length: numPages }, (_, i) =>
        activeBorders.slice(i * maxBordersPerPage, (i + 1) * maxBordersPerPage)
    );
    console.log(pages[0])
    console.log(pages[1])
    console.log(pages.length > 0 ? pages[0].length + (pages[1] ? pages[1].length : 0) : 0, "pages");

    const saveAsPDF = () => {
        const element = tableRef.current;
        const opt = {
            margin: 0.2,
            filename: "borders.pdf",
            image: { type: "jpeg", quality: 1 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };
        html2pdf().from(element).set(opt).save();
    };

    const addNameToBorder = (number) => {
        setBorders((prevBorders) => {
            const updatedBorders = prevBorders.map((border) =>
                border.number === number ? { ...border, name: newName } : border
            );
            return updatedBorders;
        });
        setNewName("");
        setIsTokenInputVisible(false);
    };

    const addWithoutBorder = (name) => {
        if (!name || borders.some(border => border.name === name)) return; // Avoid duplicates
        setBorders((prevBorders) => {
            const nextNumber =
                prevBorders.length > 160 ? prevBorders.length + 1 : 161;
            return [
                ...prevBorders,
                { number: nextNumber, name: name, status: "active" },
            ];
        });
        setNewName(""); // Clear the input after adding
    };

    const removeNameToBorder = (name) => {
        if (!name) return;

        const remainedBorders = borders.filter(border => border.name !== name);
        setBorders(remainedBorders);
    };

    const processVoiceCommand = (command) => {
        const commandParts = command.split(" ");
        const action = commandParts[0]; // "active" or "inactive"
        const numbers = commandParts.slice(1).map(Number); // Convert to numbers

        if (action === "active" || action === "inactive") {
            numbers.forEach((number) => {
                toggleBorderStatus(number);
            });
        } else if (
            action === "add" ||
            action === "plus" ||
            action === "adds" ||
            action === "at"
        ) {
            const name = commandParts.slice(1).join(" ");
            addWithoutBorder(name);
        } else if (
            action === "remove" ||
            action === "minus" ||
            action === "removes"
        ) {
            const name = commandParts.slice(1).join(" ");
            removeNameToBorder(name);
        }
    };

    const startVoiceRecognition = () => {
        const recognition = new (window.SpeechRecognition ||
            window.webkitSpeechRecognition)();
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            processVoiceCommand(command);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
        };

        recognition.start();
    };

    return (
        <div className="outerDiv bg-gray-200 flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md flex gap-4 justify-between items-center mb-6">
                <button
                    onClick={() => setFilter("active")}
                    className="p-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    Active ({activeCount})
                </button>
                <button
                    onClick={() => setFilter("inactive")}
                    className="p-2 bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                    Inactive ({inactiveCount})
                </button>

                <button
                    onClick={startVoiceRecognition}
                    className="p-2 flex justify-center items-center bg-purple-500 text-white rounded-md shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <MdOutlineSettingsVoice />
                    Voice Command
                </button>
                <button
                    onClick={() => setIsTokenInputVisible(!isTokenInputVisible)}
                    className="p-2 flex justify-center items-center bg-purple-500 text-white rounded-md shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    Tokens
                </button>
            </div>
            {isTokenInputVisible && (
                <div className="flex gap-x-2 p-2 justify-between items-center">
                    <input 
                        type="text" 
                        placeholder="Enter a name" 
                        onChange={(e) => setTokenBuyer(e.target.value)} 
                        className="w-44 h-16 rounded-sm border-1 placeholder:p-2 placeholder-purple-500 border-slate-500" 
                    />
                    <button 
                        onClick={() => addWithoutBorder(tokenBuyer)} 
                        className="p-2 flex justify-center items-center bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        Add
                    </button>
                    <button 
                        onClick={() => removeNameToBorder(tokenBuyer)} 
                        className="p-2 flex justify-center items-center bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        Remove
                    </button>
                </div>
            )}

            <div className="flex flex-wrap justify-center items-center p-4 gap-2">
                {filteredBorders.length > 0 &&
                    filteredBorders.map((border) => (
                        <div
                            key={border.number}
                            className="flex justify-center items-center p-1"
                        >
                            <div
                                onClick={() => toggleBorderStatus(border.number)}
                                className={`cursor-pointer text-white font-bold w-12 h-12 flex justify-center items-center text-xl rounded-full shadow-md transition-all duration-300 transform hover:scale-110 ${border.status === "inactive" ? "bg-red-500" : "bg-green-500"}`}
                            >
                                {border.name || border.number}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Table for Active Borders */}
            <div className="w-full mt-8 bg-white shadow-md rounded-lg p-2">
                <div ref={tableRef}>
                   
                    {/* Table Header for Borders */}
                    {pages.map((pageBorders, pageIndex) => (
                        <div key={pageIndex} className="w-full mt-8 bg-white shadow-md rounded-lg p-2">
                             <h2 className="text-center text-xl mb-2 font-bold">
                        ফরিদপুর ইঞ্জিনিয়ারিং কলেজ
                    </h2>
                    <h2 className="text-center text-xl mb-2 font-bold">
                        বঙ্গবন্ধু শেখ মুজিবুর রহমান হল (সাউথ হল)
                    </h2>

                    {/* Editable rows: তারিখ and ম্যানেজার */}
                    <table className="table-auto w-full border-collapse mb-2">
                        <thead>
                            <tr>
                                <th className="border px-1 py-1 text-center">তারিখ</th>
                                <th className="border px-1 py-1 text-center">নেট মিল</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border px-1 py-1 text-center">
                                    {new Date().toLocaleDateString("en-BD", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </td>
                                <td className="border px-1 py-1 text-center">
                                    {activeBorders.length + 5}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                            <table className="table-auto w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border px-1 py-1">বর্ডার নং</th>
                                        <th className="border px-1 py-1">দুপুর</th>
                                        <th className="border px-1 py-1">রাত</th>
                                        <th className="border px-1 py-1">বর্ডার নং</th>
                                        <th className="border px-1 py-1">দুপুর</th>
                                        <th className="border px-1 py-1">রাত</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 26 }, (_, rowIndex) => {
                                        const firstBorder = pageBorders[rowIndex] || {};
                                        const secondBorder = pageBorders[rowIndex + maxBordersPerPage / 2] || {};
                                        console.log(firstBorder,"first")
                                        console.log(secondBorder,"second")
                                        console.log(pageBorders ,"pageborder")
                                        return (
                                            <tr key={rowIndex}>
                                                <td className="border px-1 py-1 text-center">
                                                    {firstBorder.name || firstBorder.number || ""}
                                                </td>
                                                <td className="border px-1 py-1 text-center"></td>
                                                <td className="border px-1 py-1 text-center"></td>
                                                <td className="border px-1 py-1 text-center">
                                                    {secondBorder.name || secondBorder.number || ""}
                                                </td>
                                                <td className="border px-1 py-1 text-center"></td>
                                                <td className="border px-1 py-1 text-center"></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
                <button
                    onClick={saveAsPDF}
                    className="mt-4 p-2 bg-blue-500 text-white rounded-md"
                >
                    Save as PDF
                </button>
            </div>
        </div>
    );
}

export default BorderCounter;
