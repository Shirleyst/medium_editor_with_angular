import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { ValueConverter } from '@angular/compiler/src/render3/view/template';

@Injectable({
    providedIn: 'root'
})
export class FirebaseService {

    constructor(public db: AngularFirestore) { }

    // addData adds a doc to firebase
    addData(user, text) {
        return this.db.collection('user').doc(user.email).set({
            name: user.name,
            email: user.email,
            text: text
        });
    }

    // getData gets a doc from firebase with given user email
    getData(user) {
        return this.db.collection('user').doc(user.email).snapshotChanges();
    }

    // syncData creates a doc if no doc with the given email exists, 
    // otherwise it updates the existing doc's text to the given one
    syncData(user, text) {
        // check if user exist
        var docRef = this.db.collection('user').doc(user.email);
        docRef.get().subscribe((docSnapshot) => {
            if (!docSnapshot.exists) {
                // if not create
                this.addData(user, text)
            } else {
                this.db.collection('user').doc(user.email).set({
                    name: user.name,
                    text: text
                })
            }
        })
    }
}