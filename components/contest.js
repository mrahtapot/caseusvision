import {useEffect, useRef, useState} from "react";
import {collection, onSnapshot, query, doc, updateDoc, deleteDoc, where, Timestamp, setDoc} from "firebase/firestore";
import {db} from "../firebase";
import router from "next/router";

//TODO: Stop sending data in useEffect, move total point to voting, make sure voting doesn't send too many writes

const Submission = (props) => {
    const [link, setLink] = useState("")
    const [name, setName] = useState("")
    const [artist, setArtist] = useState("")
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [songs, setSongs] = useState([])

    //checks if already participated or not
    useEffect(() => {
        const q = query(collection(db, "songs"), where("country", "==", props.country), where("contest", "==", props.id))
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (querySnapshot.docs.length === 1){
                setLink(querySnapshot.docs[0].data().link)
                setName(querySnapshot.docs[0].data().name)
                setArtist(querySnapshot.docs[0].data().artist)
                return setAlreadySubmitted(true)
            } else if (querySnapshot.docs.length > 1) {
                alert("An error occured!")
            }

            setAlreadySubmitted(false)
        })
    }, [props])

    const submitSong = async () => {
        const q = query(collection(db, "songs"), where("name", "==", name), where("artist", "==", artist))
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            console.log(querySnapshot.docs)
            if (querySnapshot.docs.length === 0){
                const docRef = await setDoc(doc(db, "songs", "cv"+props.id+"-"+props.country), {
                    name: name,
                    artist: artist,
                    link: link,
                    country: props.country,
                    contest: props.id,
                    point: 0,
                });
                console.log(docRef)
                alert("Submitted!")
                router.reload()
            } else if (querySnapshot.docs.length >= 1) {
                querySnapshot.docs.map((song) => {
                    if (song.data().country !== props.country) {
                        alert("Song is already sent!")
                    }
                })
            } else if (querySnapshot.docs.length < 0) {
                alert("An error occurred!")
            }
        })
    }

    const changeSong = async () => {
        const q = query(collection(db, "songs"), where("name", "==", name), where("artist", "==", artist))
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            console.log(querySnapshot.docs)
            if (querySnapshot.docs.length === 0){
                const ref = doc(db, "songs", "cv"+props.id+"-"+props.country);
                await updateDoc(ref, {
                    name: name,
                    artist: artist,
                    link: link,
                });
                console.log(ref)
                router.reload()
                alert("Changed!")
                //TODO: When you change only the link it doesn't see the change? and there are problems that I fixed by reloading lol
            }  else if (querySnapshot.docs.length >= 1) {
                querySnapshot.docs.map((song) => {
                    if (song.data().country !== props.country) {
                        alert("Song is already sent!")
                    } else if (song.data().name === name && song.data().artist === artist && song.data().link === link) {
                        alert("You should change the song before submitting it")
                        router.reload()
                    } else {
                        alert("An error occurred!")
                        router.reload()
                    }
                })
            } else {
                alert("An error occurred!")
            }
        })
        return
    }

    useEffect(() => {
        const q = query(collection(db, "songs"), where("contest", "==", props.id))
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const array = []
            querySnapshot.docs.map((song)=>{
                array.push(Object.entries(song.data()))
            })
            setSongs(array)
        })
    }, [props])

    const songItems = songs.map((song) => {
        const disqualify = async () => {
            await deleteDoc(doc(db, "songs", "cv"+props.id+"-"+song.find(pair => pair[0] === 'country')[1]))
        }

        const copyUrl =  () => {
            navigator.clipboard.writeText(song.find(pair => pair[0] === 'link')[1])
            alert("Link Copied")
        }

        const goToLink = () => {
            window.open(
                song.find(pair => pair[0] === 'link')[1], "_blank");
        }

        return (
            <div key={song.id}>
                {song.find(pair => pair[0] === 'country')[1]}-
                {song.find(pair => pair[0] === 'artist')[1]}-
                {song.find(pair => pair[0] === 'name')[1]}
                <button onClick={copyUrl}>Copy Link</button>
                <button onClick={goToLink}>Go to Link</button>
                <button onClick={disqualify}>Disqualify</button>
            </div>
        )
    });

    return (
        <div>
            {alreadySubmitted ?
                <div>
                    <h3>Change Your Song</h3>
                    <label>Link</label>
                    <input value={link} onChange={(e) => setLink(e.target.value)} />
                    <label>Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                    <label>Artist</label>
                    <input value={artist} onChange={(e) => setArtist(e.target.value)} />
                    <button onClick={changeSong}>Submit</button>
                </div>
                :
                <div>
                    <h3>Submit a Song</h3>
                    <label>Link</label>
                    <input onChange={(e) => setLink(e.target.value)} />
                    <label>Name</label>
                    <input onChange={(e) => setName(e.target.value)} />
                    <label>Artist</label>
                    <input onChange={(e) => setArtist(e.target.value)} />
                    <button onClick={submitSong}>Submit</button>
                </div>
            }
            {props.isHost ?
                <div>
                    Submitted Songs
                    {songItems}
                </div>
                :
                <div />
            }
        </div>
    )
}

const WaitForVoting = (props) => {
    const [songs, setSongs] = useState([])

    useEffect(() => {
        const q = query(collection(db, "songs"), where("contest", "==", props.id))
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const array = []
            querySnapshot.docs.map((song)=>{
                array.push(Object.entries(song.data()))
            })
            setSongs(array)
            console.log(songs)
        })
    }, [])

    const songItems = songs.map((song) => {
        const disqualify = async () => {
            await deleteDoc(doc(db, "songs", "cv"+props.id+"-"+song.find(pair => pair[0] === 'country')[1]))
        }

        const copyUrl =  () => {
            navigator.clipboard.writeText(song.find(pair => pair[0] === 'link')[1])
            alert("Link Copied")
        }

        const goToLink = () => {
            window.open(
                song.find(pair => pair[0] === 'link')[1], "_blank");
        }

        return (
            <div key={song.id}>
                {song.find(pair => pair[0] === 'country')[1]}-{song.find(pair => pair[0] === 'artist')[1]}-{song.find(pair => pair[0] === 'name')[1]}
                <button onClick={copyUrl}>Copy Link</button>
                <button onClick={goToLink}>Go to Link</button>
                <button onClick={disqualify}>Disqualify</button>
            </div>
        )
    });

    return (
        <div>
            {props.isHost ?
                <div>
                    State: Wait for voting
                    {songItems}
                </div>
                :
                <div>
                    <p>Please wait for the voting</p>
                </div>
            }
        </div>
    )
}

const Voting = (props) => {
    const [songs, setSongs] = useState([])
    const [votes, setVotes] = useState([])
    const [oldVotes, setOldVotes] = useState([])
    const [totalVotes, setTotalVotes] = useState(0)
    const [alreadyVoted, setAlreadyVoted] = useState(false)
    let voteArray = []
    let oldVoteArray = []

    //creates an array list from the songs in the contest
    useEffect(() => {
        const q1 = query(collection(db, "songs"), where("contest", "==", props.id))
        const unsubscribe1 = onSnapshot(q1, async (querySnapshot) => {
            const array = []
            querySnapshot.docs.map((song)=>{
                let points = 0
                const q2 = query(collection(db, "votes"), where("to", "==", song.data().country), where("contest", "==", props.id))
                const unsubscribe = onSnapshot(q2, async (querySnapshot) => {
                    querySnapshot.docs.map((vote) => {
                        points += vote.data().point
                    })
                    const ref = doc(db, "songs", "cv"+props.id+"-"+song.data().country);
                    await updateDoc(ref, {
                        point: points
                    });
                })
                array.push(Object.entries(song.data()))
                voteArray.push({"from": props.country, "to": song.data().country, "point": 0})
            })
            setSongs(array)
            setVotes(voteArray)
        })
    }, [props])
    //TODO: Check if you should do something else than props

    //counts the total vote count
    useEffect(() => {
        let voteCount = 0
        votes.map((vote) => {
            voteCount = voteCount+vote.point
        })
        setTotalVotes(voteCount)
    }, [votes])

    //checks if voted or not
    useEffect(() => {
        const q = query(collection(db, "votes"), where("from", "==", props.country), where("contest", "==", props.id))
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (querySnapshot.docs.length >= 1){
                querySnapshot.docs.map((vote) => {
                    oldVoteArray.push({"from": vote.data().from, "to": vote.data().to, "point": vote.data().point})
                })
                await setOldVotes(oldVoteArray)
                return setAlreadyVoted(true)
            }

            setAlreadyVoted(false)
        })
    }, [props, votes])

    const songItems = songs
        .sort((a, b) => b.find(pair => pair[0] === 'artist')[1]-a.find(pair => pair[0] === 'artist')[1])
        .map((song) => {
        if (song.find(pair => pair[0] === 'country')[1] === props.country) {
            return (
                <div key={song.id}>
                    {song.find(pair => pair[0] === 'artist')[1]}-{song.find(pair => pair[0] === 'name')[1]}
                </div>
            )
        } else {
            let point = oldVotes.filter(vote => vote.to === song.find(pair => pair[0] === 'country')[1])[0]?.point
            return (
                <div key={song.id}>
                    {song.find(pair => pair[0] === 'artist')[1]}-{song.find(pair => pair[0] === 'name')[1]}
                    {alreadyVoted ?
                        <div>
                            {point} =&gt;
                        </div>
                        : <div/>}
                    <input onChange={(e) => {
                        let filteredVote = votes.filter(vote => vote.to === song.find(pair => pair[0] === 'country')[1])[0]
                        voteArray = votes.filter(vote => vote.to !== song.find(pair => pair[0] === 'country')[1])
                        filteredVote.point = parseInt(e.target.value)
                        voteArray.push(filteredVote)
                        setVotes(voteArray)
                    }} type={"number"} min={0} max={8} defaultValue={0}/>
                </div>
            )
        }
    });

    const vote = () => {
        if(totalVotes===8) {
            votes.map(async (vote) => {
                const docRef = await setDoc(doc(db, "votes", "cv"+props.id+"-"+vote.from+"->"+vote.to), {
                    from: vote.from,
                    to: vote.to,
                    point: vote.point,
                    contest: props.id
                })})
            setOldVotes(votes)
        } else {
            alert("Please make sure you send exactly 8 points")
        }
    }

    const changeVote = async () => {
        //TODO: WEIRD ERRORS HERE
        if(totalVotes===8) {
            votes.map(async (votee) => {
                deleteVote(votee)
                vote()
            })
        }
        /*
        if(totalVotes===8) {
            votes.map(async (vote) => {
                console.log(vote)
                const ref1 = doc(db, "votes", "cv"+props.id+"-"+vote.from+"->"+vote.to);
                await updateDoc(ref1, {
                    point: vote.point
                }).then(
                    setOldVotes(votes)
                )
            })

            console.log(oldVotes)
            alert("Vote changed!")
            router.reload()
        } else {
            alert("Please make sure you send exactly 8 points")
        }

         */
    }

    const deleteVote = async (vote) => {
        await deleteDoc(doc(db, "votes", "cv"+props.id+"-"+vote.from+"->"+vote.to))
    }

    const songItemsHost = songs
        .sort((a, b) => b.find(pair => pair[0] === 'point')[1]-a.find(pair => pair[0] === 'point')[1])
        .map((song) => {
            const disqualify = async () => {
                await deleteDoc(doc(db, "songs", "cv"+props.id+"-"+song.find(pair => pair[0] === 'country')[1]))
            }

            return (
                <div key={song.id}>
                    {song.find(pair => pair[0] === 'country')[1]}-{song.find(pair => pair[0] === 'artist')[1]}
                    -{song.find(pair => pair[0] === 'name')[1]}-{song.find(pair => pair[0] === 'point')[1]}
                    <button onClick={disqualify}>Disqualify</button>
                </div>
            )
        });

    return (
        <div>
            {alreadyVoted ?
                <div>
                    Change Your Vote?
                    ({8-totalVotes})
                    {songItems}
                    <button onClick={changeVote}>Change Vote</button>
                </div>
            :
                <div>
                    Voting
                    ({8-totalVotes})
                    {songItems}
                    <button onClick={vote}>Vote</button>
                </div>
            }
            {props.isHost ?
                <div>
                    Songs:
                    {songItemsHost}
                </div>
                :
                <div />
            }
        </div>
    )
}

const WaitForResults = (props) => {
    const [songs, setSongs] = useState([])

    //creates an array list from the songs in the contest, updates the final results in songs
    useEffect(() => {
        const q1 = query(collection(db, "songs"), where("contest", "==", props.id))
        const unsubscribe1 = onSnapshot(q1, async (querySnapshot) => {
            const array = []
            querySnapshot.docs.map((song)=>{
                let points = 0
                const q2 = query(collection(db, "votes"), where("to", "==", song.data().country), where("contest", "==", props.id))
                const unsubscribe = onSnapshot(q2, async (querySnapshot) => {
                    querySnapshot.docs.map((vote) => {
                        points += vote.data().point
                    })
                    const ref = doc(db, "songs", "cv"+props.id+"-"+song.data().country);
                    await updateDoc(ref, {
                        point: points
                    });
                })
                array.push(Object.entries(song.data()))
            })
            setSongs(array)
        })
    }, [props])

    const songItems = songs
        .sort((a, b) => b.find(pair => pair[0] === 'point')[1]-a.find(pair => pair[0] === 'point')[1])
        .map((song) => {
            const disqualify = async () => {
                await deleteDoc(doc(db, "songs", "cv"+props.id+"-"+song.find(pair => pair[0] === 'country')[1]))
            }

        return (
            <div key={song.id}>
                {song.find(pair => pair[0] === 'country')[1]}-{song.find(pair => pair[0] === 'artist')[1]}
                -{song.find(pair => pair[0] === 'name')[1]}-{song.find(pair => pair[0] === 'point')[1]}
                <button onClick={disqualify}>Disqualify</button>
            </div>
        )
    });

    return (
        <div>
            {props.isHost ?
                <div>
                    State: Wait for results
                    Songs:
                    {songItems}
                </div>
                :
                <div>
                    <p>Please wait for the results</p>
                </div>
            }
        </div>
    )

}

const Results = (props) => {
    const [songs, setSongs] = useState([])
    const [receivedVotes, setReceivedVotes] = useState([])
    const [givenVotes, setGivenVotes] = useState([])
    const array = []
    const receivedVotesArray = []
    const givenVotesArray = []

    useEffect(() => {
        return () => {
            setSongs([])
        };
    }, [])

    //TODO: For some reason here some songs are returned as doubles
    //creates an array list from the songs in the contest, updates the final results in songs
    useEffect(() => {
        const q1 = query(collection(db, "songs"), where("contest", "==", props.id))
        const unsubscribe1 = onSnapshot(q1, async (querySnapshot) => {
            querySnapshot.docs.map((song)=>{
                array.push(Object.entries(song.data()))
            })
            setSongs(array)
        })

        const q2 = query(collection(db, "votes"), where("to", "==", props.country), where("contest", "==", props.id))
        const unsubscribe2 = onSnapshot(q2, async (querySnapshot) => {
            await querySnapshot.docs
                .map((vote) => {
                    if (vote.data().point !== 0){
                        receivedVotesArray.push({"from":vote.data().from, "point":vote.data().point})
                    }
                })
            setReceivedVotes(receivedVotesArray)
        })


        const q3 = query(collection(db, "votes"), where("from", "==", props.country), where("contest", "==", props.id))
        const unsubscribe3 = onSnapshot(q3, async (querySnapshot) => {
            await querySnapshot.docs
                .map((vote) => {
                    if (vote.data().point !== 0){
                        givenVotesArray.push({"to":vote.data().to, "point":vote.data().point})
                    }
                })
            setGivenVotes(givenVotesArray)
        })
    }, [props])

    const overallResults = songs
        .sort((a, b) => b.find(pair => pair[0] === 'point')[1]-a.find(pair => pair[0] === 'point')[1])
        .map((song)=>
            <div key={song.id}>
                {song.find(pair => pair[0] === 'country')[1]}
                -
                {song.find(pair => pair[0] === 'artist')[1]}
                -
                {song.find(pair => pair[0] === 'name')[1]}
                -
                {song.find(pair => pair[0] === 'point')[1]}
            </div>
        )

    const receivedVoteResults = receivedVotes
        .sort((a, b) => b.point-a.point)
        .map((vote) =>
            <div key={vote.id}>
                {vote.from}
                -
                {vote.point}
            </div>)

    const givenVoteResults = givenVotes
        .sort((a, b) => b.point-a.point)
        .map((vote) =>
            <div key={vote.id}>
                {vote.to}
                -
                {vote.point}
            </div>)

    return (
        <div>
            Results
            {overallResults}
            You received votes from:
            {receivedVoteResults}
            You gave votes to:
            {givenVoteResults}
        </div>
    )
}

const Contest = (props) => {
    const [id, setId] = useState(0)
    const [theme, setTheme] = useState("")
    const [desc, setDesc] = useState("")
    const [host, setHost] = useState("")
    const [state, setState] = useState("")
    const [nextState, setNextState] = useState("")
    const [start, setStart] = useState("")
    const [end, setEnd] = useState("")
    const [country, setCountry] = useState("")
    const [userParticipated, setUserParticipated] = useState(false)
    const [isHost, setIsHost] = useState(false)
    const [cancelButton, setCancelButton] = useState(false)

    useEffect(() => {
        setId(props.id)
        setTheme(props.info.theme)
        setDesc(props.info.description)
        setState(props.info.state)
        setHost(props.info.host)
        setIsHost(props.isHost)
        let startDate = new Date(new Timestamp(props.info.start?.seconds,props.info.start?.nanoseconds).toDate()).toLocaleDateString('tr-TR')
        setStart(startDate)

        if (state === "song submission") {
            setNextState("wait for voting")
            setCancelButton(true)
        } else if (state === "wait for voting") {
            setNextState("voting")
            setCancelButton(true)
        } else if (state === "voting") {
            setNextState("wait for results")
            setCancelButton(false)
        } else if (state === "wait for results") {
            setNextState("results")
        } else if (state === "results") {
            setNextState("finished")
        }

        const q = query(collection(db, "users"), where("email", "==", props.user.email))
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            setCountry(querySnapshot.docs[0].data().country)
        })

        const q2 = query(collection(db, "songs"), where("country", "==", country), where("contest", "==", id))
        const unsubscribe2 = onSnapshot(q2, (querySnapshot) => {
            if (querySnapshot.docs.length > 0){
                return setUserParticipated(true)
            }

            setUserParticipated(false)
        })

        const q3 = query(collection(db, "contests"), where("host", "==", country))
        const unsubscribe3 = onSnapshot(q3, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if(doc.data().contest === id){
                    setIsHost(true)
                }
            })
        })
    }, [props, country, host, id, state])

    useEffect(()=>{
        const q3 = query(collection(db, "contests"), where("host", "==", country))
        const unsubscribe3 = onSnapshot(q3, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
                if(doc.data().contest === id){
                    setIsHost(true)
                }
            })
        })
    },[country, id])

    const stateView = () => {
        if (state === "song submission") {
            return (
                <Submission id={id} country={country} isHost={isHost} />
            )
        } else if (userParticipated) {
            if (state === "wait for voting") {
                return (
                    <WaitForVoting id={id} country={country} isHost={isHost} />
                )
            } else if (state === "voting") {
                return (
                    <Voting id={id} country={country} isHost={isHost} />
                )
            } else if (state === "wait for results") {
                return (
                    <WaitForResults id={id} country={country} isHost={isHost} />
                )
            } else if (state === "results") {
                return (
                    <Results id={id} country={country} isHost={isHost} />
                )
            }
        } else {
            return (<p>You have not participated in the current contest</p>)
        }
    }

    const goToNextState = async () => {
        const ref = doc(db, "contests", props.id);
        await updateDoc(ref, {
            state: nextState
        });
        console.log(ref)
        alert("Changed state to "+nextState)
        if(nextState === "finished"){
            router.reload()
        }
    }

    const cancelContest = async () => {
        const q = query(collection(db, "songs"), where("contest", "==", id))
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach(async(docs) => {
                console.log(docs.id)
                await deleteDoc(doc(db, "songs", docs.id))
            })
        })
        await deleteDoc(doc(db, "contests", id.toString()))

        alert("Contest cancelled")
        router.reload()
    }

    return (
        <div>
            You are: {country}
            and you are the host? {isHost ? <div>yes</div>:<div>no</div>}
            <ul>
                <li key={id.id}>caseusvision {id}</li>
                <li key={theme.id}>{theme}</li>
                <li key={desc.id}>{desc}</li>
                <li key={host.id}>{host}</li>
                <li key={state.id}>{state}</li>
                <li key={start.id}>{start}</li>
                {stateView()}
                {isHost ?
                    <div>
                        <button onClick={goToNextState}>{nextState}</button>
                        {cancelButton ?
                            <button onClick={cancelContest}>Cancel Contest</button>
                            :
                            <div/>
                        }
                    </div>
                    :
                    <div />
                }
            </ul>
        </div>
    );
}

export default Contest