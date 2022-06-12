import React from "react";

interface IVideo {
    videoId: string;
    title: string;
    score: number;
    stats: {
        diversity: number;
        lexicon: number;
        speed: number;
    };
}

interface IAppProps {}
interface IAppState {
    content: IVideo[] | null;
}

class App extends React.Component<IAppProps, IAppState> {
    constructor(props: IAppProps) {
        super(props);

        this.state = {
            content: null
        };
    }

    componentDidMount() {
        fetch("http://localhost:3001/list").then((res) => {
            if (res.ok) {
                res.json().then((content) =>
                    this.setState({
                        content: content
                    })
                );
            }
        });
    }

    render() {
        if (this.state.content) {
            return (
                <div className="App">
                    {this.state.content.map((video) => (
                        <p key={video.videoId}>
                            {video.stats.lexicon} - {video.title}
                        </p>
                    ))}
                </div>
            );
        } else {
            return <div className="App">No content.</div>;
        }
    }
}

export default App;
