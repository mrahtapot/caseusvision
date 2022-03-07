import styles from '../styles/Home.module.css'
import { getAuth } from "firebase/auth";
import {useState} from "react";
import router from "next/router";
import {collection, addDoc, query, where, onSnapshot} from "firebase/firestore";
import {db} from "../firebase";


export default function Register() {
    const auth = getAuth();
    const user = auth.currentUser;
    const [country, setCountry] = useState("")

    const addCountryToUser = () => {
        console.log(country)

        const q = query(collection(db, "users"), where("country", "==", country))
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            console.log(querySnapshot.docs)
            if (querySnapshot.docs.length === 0){
                const docRef = await addDoc(collection(db, "users"), {
                    email : user.email,
                    country : country,
                    state : "pending"
                });
                console.log("Document written with ID: ", docRef.id);
                router.push("/home")
            } else if (querySnapshot.docs.length !== 0 && user.email !== querySnapshot.docs[0].data().email) {
                console.log(querySnapshot.docs)
                alert("This country name is already taken")
            }
        })
    }

  return (
    <div className={styles.container}>
        <label>Set a country name:</label>
        <input onChange={(e) => setCountry(e.target.value)} />
        <button onClick={addCountryToUser}>Done!</button>
    </div>
  )
}
