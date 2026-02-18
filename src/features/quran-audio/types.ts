export type QuranAudioChapter = {
  index: number;
  name: string;
  nameTrans: string;
  nameMl: string;
  fileName: string;
  size: string;
  durationInSecs: number;
};

export type QuranAudioConfig = {
  baseUrl: string;
  shareText: string;
  mail: {
    subject: string;
    to: string[];
  };
  chapters: QuranAudioChapter[];
};

