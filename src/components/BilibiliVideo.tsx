import React from 'react';

interface BilibiliVideoProps {
  bvid: string;  // B站视频的BV号
  width?: string;  // 视频宽度
  height?: string;  // 视频高度
}

const BilibiliVideo: React.FC<BilibiliVideoProps> = ({ 
  bvid, 
  width = '100%', 
  height = '500px' 
}) => {
  return (
    <div style={{ 
      width: width, 
      height: height,
      position: 'relative',
      margin: '20px 0'
    }}>
      <iframe
        src={`//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=1`}
        scrolling="no"
        frameBorder="0"
        allowFullScreen
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
};

export default BilibiliVideo; 