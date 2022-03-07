import { useEffect } from 'react'
import {
    getAuth,
    GoogleAuthProvider,
    signInWithRedirect,
    getRedirectResult,
} from "firebase/auth";
import router from "next/router";

const FirebaseAuth = () => {
    const auth = getAuth()
    const provider = new GoogleAuthProvider();

    const signIn = () => {
        signInWithRedirect(auth, provider)
    }

    //checks if the user signed in for the first time after returning
    useEffect(()=>{
        getRedirectResult(auth)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access Google APIs.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                const user = result.user;
                console.log("result",result)
                if(user.metadata.creationTime===user.metadata.lastSignInTime){
                    router.push("/register")
                } else {
                    router.push("/")
                }
            }).catch((error) => {
                console.log(error)
        });
    },[auth])

    return (
        <div>
            <button onClick={signIn}>sign in</button>
        </div>
    )
}

export default FirebaseAuth