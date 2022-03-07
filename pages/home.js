import styles from '../styles/Home.module.css'
import { getAuth, signOut } from "firebase/auth";
import {useEffect, useState} from "react";
import router from "next/router";
import {collection, setDoc, doc, query, where, onSnapshot, Timestamp} from "firebase/firestore";
import {db} from "../firebase";
import Contest from "../components/contest";

export default function Home(props) {
    const auth = getAuth();
    const user = auth.currentUser;
    const [country, setCountry] = useState("")
    const [userState, setUserState] = useState("")
    const [numContests, setNumContests] = useState(0)
    const [activeContest, setActiveContest] = useState(false)
    const [contestInfo, setContestInfo] = useState({})
    const [id, setId] = useState(0)
    const [isHost, setIsHost] = useState(false)

    //Gets the country name of the current user
    useEffect(() => {
        if (user) {
            const q = query(collection(db, "users"), where("email", "==", user.email))

            const unsubscribe = onSnapshot(q, async (querySnapshot) => {
                console.log(querySnapshot.docs)
                await setCountry(querySnapshot.docs[0].data().country)
                await setUserState(querySnapshot.docs[0].data().state)
                console.log(country)
            })
            return unsubscribe;
        }
    },[auth, numContests, user, country])

    //Finds number of existing contests for numbering a new one
    //...and finds if there is an active contest or not
    useEffect(() => {
        const q1 = query(collection(db, "contests"))
        const unsubscribe1 = onSnapshot(q1, (querySnapshot) => {
            setNumContests(querySnapshot.docs.length)
        })

        const q = query(collection(db, "contests"), where("state", "!=", "finished"))
        const unsubscribe = onSnapshot(q, async(querySnapshot) => {
            if (querySnapshot.docs.length === 1){
                if(querySnapshot.docs[0].data().host === country){
                    setIsHost(true)
                }
                setId(querySnapshot.docs[0].id)
                setContestInfo(querySnapshot.docs[0].data())
                setActiveContest(true)
            } else if (querySnapshot.docs.length > 1){
                alert("An error occured!")
            }
        })
        return unsubscribe;
    }, [activeContest, country])

    const [desc, setDesc] = useState("")
    const [theme, setTheme] = useState("")

    const createContest = async () => {
        const docRef = await setDoc(doc(db, "contests", (numContests+1).toString()), {
            contest: numContests+1,
            description: desc,
            theme: theme,
            state: "song submission",
            start: Timestamp.fromDate(new Date()),
            host: country
        });
        console.log(docRef)
    }

    const signOutClick = () => {
        signOut(auth).then(() => {
            console.log("Sign out is successful")
            router.push("/")
        }).catch((error) => {
            console.log(error)
        });
    }

    return (
        <div className={styles.container}>
            {(userState === "accepted") ?
                <div>
                    {activeContest ?
                        <Contest id={id} info={contestInfo} user={user} isHost={isHost} setActiveContest={setActiveContest}/>
                        :
                        <div>
                            <h3>Create A Contest</h3>
                            <label>Description</label>
                            <input onChange={(e) => setDesc(e.target.value)} />
                            <label>Theme</label>
                            <input onChange={(e) => setTheme(e.target.value)} />
                            <button onClick={createContest}>Create</button>

                            <div>
                                <ul>
                                    Gelecekte eklenmesi planlanan özellikler:
                                    <li>Ev sahibinin detaylı oy dağılımını görmesi</li>
                                    <li>Kenar çubuğu</li>
                                    <li>Ayarlar: Ülke ismi değiştirme, dark/light mode</li>
                                    <li>Diskalifiy/Yarışma iptali durumlarında &quot;bunu yapmak istediğinize emin misiniz?&quot; ekranı</li>
                                    <li>Türkçe dil seçeneği</li>
                                    <li>Eski yarışmalara bakabilmek, filtreleyebilmek için arşiv</li>
                                    <li>Spotify API ile şarkı linki konulduğunda direkt isim ve şarkıcının otomatik gelmesi</li>
                                    <li>Hatırlatma emaili</li>
                                    <li>Canlı sonuç takibi: Normal Eurovision gibi her ülkenin puanlarının tek tek gelmesi ve buna göre skorun değişmesi</li>
                                    <li>Beğendiğin şarkıları bir Spotify playlistine ekleme özelliği</li>
                                </ul>
                            </div>
                        </div>
                    }
                </div>
                :
                <div>
                    {(userState === "pending") ?
                        <div>Your account is still pending, please wait for the admin to accept you</div>
                        :
                        <div>Please wait</div>
                    }
                </div>
            }
            <button onClick={signOutClick}>Sign Out</button>
        </div>
    )
}
