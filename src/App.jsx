import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRefs = useRef([]);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    const allVideo = document.getElementsByTagName('video')
    Array.from(allVideo).forEach((vid) => {
      vid.playbackRate = 2; 
    });
  }, [videos]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://mandala-verse-bknd.yikew40375.workers.dev/api/files');
      const data = await response.json();

      if(!data.data || !data.data.files){
        // throw error
        return;
      }

      const videosWithSignedUrls = await Promise.all(
        data.data.files.map(async (file) => ({
          ...file,
          signedUrl: await getSignedUrl(file.cid),
        }))
      );
      setVideos(videosWithSignedUrls);

    
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (fileUrl) => {
    try {
      const response = await fetch(`https://mandala-verse-bknd.yikew40375.workers.dev/api/sign?url=${encodeURIComponent(fileUrl)}`);
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const preloadVideos = () => {
    const nextIndex = (currentIndex + 1) % videos.length;
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;

    [prevIndex, currentIndex, nextIndex].forEach((index) => {
      if (videoRefs.current[index]) {
        videoRefs.current[index].load();
      }
    });
  };

  const handleVideoEnd = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto h-screen overflow-hidden">
      {videos.map((video, index) => (
        <div 
          key={video.id} 
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-300 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={video.signedUrl}
            className="w-full h-full object-cover"
            // loop
            // autoPlay={index === currentIndex}
            // muted
            // playsInline
            // onEnded={handleVideoEnd}
            controls
            id={video.signedUrl}
            on
          />
          {/* <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
            <h2 className="text-white font-bold mb-2">{video.name}</h2>
            <p className="text-white text-sm">{video.caption || 'No caption provided'}</p>
          </div> */}
          <div className="absolute right-4 bottom-20 flex flex-col items-center space-y-4">
            <button className="p-2 bg-gray-800 rounded-full">
              Share
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default App