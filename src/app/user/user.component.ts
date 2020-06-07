import { Component, ViewChild, ElementRef, OnInit, SimpleChanges } from '@angular/core';
import { UserService } from '../core/user.service';
import { AuthService } from '../core/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FirebaseUserModel } from '../core/user.model';
import { FirebaseService } from '../service/firebase.service';
import MediumEditor from 'medium-editor';
import { Observable } from 'rxjs';
import { ConfigService } from '../config.service'

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
  content: string;
  mathJaxObject;
  @ViewChild('editable') editable: ElementRef;

  constructor(
    public userService: UserService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    public firebaseService: FirebaseService,
    public configServie: ConfigService,
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

  //
  updateMathObt() {
    this.mathJaxObject = this.configServie.nativeGlobal()['MathJax'];
  }

  renderMath() {
    this.updateMathObt();
    let angObj = this;
    setTimeout(() => {
      angObj.mathJaxObject['Hub'].Queue(["Typeset", angObj.mathJaxObject.Hub], 'mathContent');
    }, 1000)
  }

  loadMathConfig() {
    this.updateMathObt();
    this.mathJaxObject.Hub.Config({
      showMathMenu: false,
      tex2jax: { inlineMath: [["$", "$"]], displayMath: [["$$", "$$"]] },
      menuSettings: { zoom: "Double-Click", zscale: "150%" },
      CommonHTML: { linebreaks: { automatic: true } },
      "HTML-CSS": { linebreaks: { automatic: true } },
      SVG: { linebreaks: { automatic: true } }
    });
  }

  ngOnInit(): void {
    this.route.data.subscribe(routeData => {
      let data = routeData['data'];
      if (data) {
        this.user = data;
        this.loadMathConfig();
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
      this.renderMath();
    }
    // watch any update and upload changes to firebase
    this.editor.subscribe('editableInput', (event, editable) => {
      this.renderMath();
      // remove span, script used to render math
      var data = editable.innerHTML;
      var re1 = /<span.*>(?=(\$))/g
      var re2 = /<\/span>/g;
      var re4 = /<script[^>]*>/g
      data = data.replace(re4, '$').replace(/<\/script><\/p>/g, '$<\/p> <p><br></p><p><br></p>').replace(re1, '')
      console.log(data);
      this.firebaseService.syncData(this.user, data);
      // this.renderMath();
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
