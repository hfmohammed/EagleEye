import React, { useContext, useState, useEffect, useRef } from 'react';
import { SettingsContext } from '../context/SettingsContext';

const Settings = () => {
  const { isCameraEnabled, setIsCameraEnabled, toggleCamera, inflight, switchSource, fps, setFps, rtspLinks, setRtspLinks, inputSource, setInputSource, saveSettings, settingsOpen, setSettingsOpen } = useContext(SettingsContext);

  const [ editedFps, setEditedFps ] = useState(fps);
  const [ editedRtspLinks, setEditedRtspLinks ] = useState(rtspLinks);
  const [ selectedSource, setSelectedSource ] = useState(inputSource);
  const [ errors, setErrors ] = useState([]);

  const bottomRef = useRef(null); // 👇 Ref to scroll target

  // Update local state when context values change
  useEffect(() => {
    console.log(rtspLinks)
    setSelectedSource(inputSource);
    setEditedFps(fps);
    setEditedRtspLinks(rtspLinks);
  }, [inputSource, fps, rtspLinks]);

  //
  useEffect(() => {
    bottomRef.current?.scrollIntoView({behavior: "smooth"});
    console.log(editedRtspLinks);
  }, [editedRtspLinks])

  const handleSourceChange = (event) => {
    const newSource = event.target.value;
    console.log('Source changed to:', newSource);
    setSelectedSource(newSource);
  };

  const _saveSettings = () => {
    if (selectedSource === "webcam") {
      null;
      // setEditedRtspLinks([]); // Clear RTSP link if webcam is selected
    }
    console.log('Saving settings:', { editedFps, editedRtspLinks, selectedSource });
    const newErrors = saveSettings(editedFps, editedRtspLinks, selectedSource);
    console.log("NEW ERRORS", newErrors);

    if (newErrors.length > 0) {
      setErrors(newErrors);
      console.log(newErrors);
    } else {
      console.log("success");
      setSettingsOpen(false);
    }
  }

  return (
    <>
      {/* Settings popup */}
      {settingsOpen &&
        <>
          {/* BACKDROP */}
          <div className="fixed inset-0 bg-black/50 z-40"></div>

          <section className="bg-gray-300 fixed top-0 left-0 z-50 w-1/2 h-3/4 transform translate-x-1/2 translate-y-1/6 rounded-lg shadow-lg px-6 py-4 settings-popup">
            <>
              {errors.map((error, index) => (
                <p key={index} className={'text-sm font-bold text-center text-red-500'}> {error} </p>
              ))}
            </>

            <div className="flex items-start justify-between h-auto my-2">
              <h1 className="text-2xl font-bold text-gray-800">
                Settings
              </h1>

              <button className="rounded-lg cursor-pointer bg-white px-4 py-2" onClick={() => setSettingsOpen(false)}>x</button>
            </div>

            <div className="flex flex-col space-y-4 my-4">
              <div className="flex items-center fps-input-section">
                <label className="mx-1">FPS:</label>
                <input
                  className="mx-2 px-1 bg-white rounded border-gray-600 border-1 fps-input"
                  type="number"
                  value={editedFps}
                  onChange={(e) => {
                    setEditedFps(e.target.value);
                  }}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>

              <div className="flex items-center source-input-section">
                <label className="mx-1">Input Source:</label>
                <input
                  className="ml-2"
                  type="radio"
                  name="input-source"
                  id="webcam-input-source"
                  value="webcam"
                  checked={selectedSource === "webcam"}
                  onChange={handleSourceChange}
                />
                <label className="mx-1" htmlFor="webcam-input-source">Webcam</label>

                <input
                  className="ml-2"
                  type="radio"
                  name="input-source"
                  id="rtsp-input-source"
                  value="rtsp"
                  checked={selectedSource === "rtsp"}
                  onChange={handleSourceChange}
                />
                <label className="mx-1" htmlFor="rtsp-input-source">RTSP</label>
              </div>

              {selectedSource === "rtsp" && (
                <>
                  <div className="flex flex-col space-y-2 my-2 overflow-y-auto max-h-96">
                    {editedRtspLinks.map((link, index) => (
                      <div key={index} className="flex items-center">
                        <label className="mx-1">RTSP link:</label>
                        <input
                          className="mx-2 px-1 bg-white rounded border-gray-600 border-1"
                          type="text"
                          placeholder="RTSP link"
                          value={link}
                          onChange={(e) => {
                            const updatedRtspLinks = [...editedRtspLinks];
                            updatedRtspLinks[index] = e.target.value;
                            setEditedRtspLinks(updatedRtspLinks);
                          }}
                        />

                        <button
                          className={`rounded px-2 py-1 ml-2 ${editedRtspLinks.length > 1 ? 'bg-red-500 text-white hover:bg-red-600 hover:cursor-pointer' : 'disabled cursor-not-allowed bg-gray-400 text-white'}`}
                          onClick={() => {
                            if (editedRtspLinks.length <= 1) return;
                            setEditedRtspLinks(editedRtspLinks.filter((_, i) => i !== index));
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div ref={bottomRef}></div> {/* 👈 Target to scroll to */}
                  </div>

                  <div className='flex items-center justify-center mt-2'>
                    <button className='bg-gray-100 rounded-lg px-4 py-1 hover:cursor-pointer hover:bg-gray-200' onClick={
                      () => {
                        console.log(editedRtspLinks);
                        console.log("clicked add item");
                        setEditedRtspLinks([...editedRtspLinks, '']);
                        console.log(editedRtspLinks);
                      }
                    }>
                      Add item
                    </button>
                  </div>
                </>

              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                className="bg-gray-200 rounded px-4 py-1 cursor-pointer hover:bg-gray-400 transition duration-200"
                onClick={_saveSettings}
              >
                Save
              </button>
            </div>
          </section>
        </>
      }
    </>
  );
};

export default Settings;
