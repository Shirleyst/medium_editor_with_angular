import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { UserService } from '../core/user.service';
import { AuthService } from '../core/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseUserModel } from '../core/user.model';
import { FirebaseService } from '../service/firebase.service';
import MediumEditor from 'medium-editor';
import { Observable } from 'rxjs';

const BUTTONS = [
  'bold'
  , 'italic'
  , 'underline'
  , 'subscript'
  , 'superscript'
  , 'anchor'
  , 'quote'
  , 'pre'
  , 'orderedlist'
  , 'unorderedlist'
  , 'indent'
  , 'justifyLeft'
  , 'justifyCenter'
  , 'justifyRight'
  , 'justifyFull'
  , 'h1'
  , 'h2'
  , 'h3'
  , 'h4'
  , 'h5'
  , 'h6'
]

@Component({
  selector: 'page-user',
  templateUrl: 'user.component.html',
  styleUrls: ['user.scss']
})
export class UserComponent implements OnInit {

  user: FirebaseUserModel = new FirebaseUserModel();
  profileForm: FormGroup;
  editor: any;
  content: Observable<string>;
  @ViewChild('editable') editable: ElementRef;

  constructor(
    public userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    public firebaseService: FirebaseService
  ) {

  }

  // getInitText get the text from firebase for the current user
  getInitText() {
    return new Promise((resolve) => {
      this.firebaseService.getData(this.user).subscribe(
        value => {
          this.content = value.payload.get('text');
          resolve(true);
        },
      )
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe(routeData => {
      let data = routeData['data'];
      if (data) {
        this.user = data;
      }
    })
  }

  async ngAfterViewInit() {
    // init medium editor
    this.editor = new MediumEditor(this.editable.nativeElement, {
      paste: {
        forcePlainText: false,
        cleanPastedHTML: true,
        cleanReplacements: [],
        cleanAttrs: ['class', 'style', 'dir', 'name'],
        cleanTags: ['meta'],
        unwrapTags: []
      },
      toolbar: {
        allowMultiParagraphSelection: true,
        buttons: BUTTONS,
        diffLeft: 0,
        diffTop: -10,
        firstButtonClass: 'medium-editor-button-first',
        lastButtonClass: 'medium-editor-button-last',
        relativeContainer: null,
        standardizeSelectionStart: false,
        static: false,
        align: 'center',
        sticky: false,
        updateOnEmptySelection: false
      },
      placeholder: false,
      anchor: {
        customClassOption: null,
        customClassOptionText: 'Button',
        linkValidation: false,
        placeholderText: 'Paste or type a link',
        targetCheckbox: false,
        targetCheckboxText: 'Open in new window'
      },
      anchorPreview: {
        hideDelay: 300
      },
    });
    // get text from firebase
    await this.getInitText();
    // set the init text for medium editor
    if (this.content) {
      var target = this.editor.elements[0];
      target.innerHTML = this.content;
    }
    // watch any update and upload changes to firebase
    this.editor.subscribe('editableInput', (event, editable) => {
      this.firebaseService.syncData(this.user, editable.innerHTML);
    })
  }

  // logout logs the current user out
  logout() {
    this.authService.doLogout()
      .then((res) => {
        this.location.back();
      }, (error) => {
        console.log("Logout error", error);
      });
  }
}
