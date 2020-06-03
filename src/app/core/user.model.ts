// FirebaseUserModel stores user strucutre
export class FirebaseUserModel {
  name: string; // user's name
  email: string;  // user's email, which is assumed to be unique

  constructor() {
    this.name = "";
    this.email = "";
  }
}
