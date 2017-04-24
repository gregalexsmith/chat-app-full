import {Observable} from "rxjs";

export class YoutubeService {
	process$(url) {
    // simulate youtube api for now
    return Observable.of({
      title: `Temp Youtube Response for ${url}`,
      type: "youtube",
      url: url,
      totalTime: 500
    }).delay(400);
	}
}
