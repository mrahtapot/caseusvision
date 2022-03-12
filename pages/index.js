import styles from '../styles/Home.module.css'
import { getAuth } from "firebase/auth";
import Auth from "../components/auth";
import router from "next/router";
import {collection, onSnapshot, query, where} from "firebase/firestore";
import {db} from "../firebase";

export default function index() {
    const auth = getAuth();
    const user = auth.currentUser;
    //const [country, setCountry] = useState("")

    auth.onAuthStateChanged(async (user)=>{
        if (user){
            //TODO: Redirecting indication
            const q = query(collection(db, "users"), where("email", "==", user.email))
            const unsubscribe = onSnapshot(q, async (querySnapshot) => {
                console.log(querySnapshot.docs)
                if (querySnapshot.docs.length === 0){
                    await router.push("/register")
                } else if (querySnapshot.docs.length === 1) {
                    await router.push("/home")
                } else {
                    alert("An error occurred")
                }
            })
        }
    })

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
          Caseusvision
          <Auth />
      </h1>
    </div>
  )
}
