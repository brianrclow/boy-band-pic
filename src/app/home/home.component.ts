import { Component, NgZone, OnInit, ViewContainerRef } from "@angular/core";
import { ModalDialogService } from "@nativescript/angular";
import * as Camera from "@nativescript/camera";
import {
  Button,
  Dialogs,
  EventData,
  ImageAsset,
  ImageSource,
  View,
} from "@nativescript/core";
import {
  DateTimePicker,
  DateTimePickerStyle,
} from "@nativescript/datetimepicker";
import * as imagePickerPlugin from "@nativescript/imagepicker";
import { ImagePicker } from "@nativescript/imagepicker";
import * as SocialShare from "@nativescript/social-share";

@Component({
  selector: "ns-home",
  templateUrl: "./home.component.html",
})
export class HomeComponent implements OnInit {
  public imageSource: ImageSource;
  public today = new Date();
  public selectedDate = new Date();
  imagePickerObj: ImagePicker;
  style = new DateTimePickerStyle(); // used for creating customs styles for the native date picker

  constructor(
    private zone: NgZone,
    private modal: ModalDialogService,
    private vcRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.checkPermissions();
  }

  checkPermissions() {
    Camera.requestPermissions().then(
      (fulfilled) => {
        // if fulfilled, do nothing to start
      },
      (rejected) => {
        this.showPermissionRejectionDialog();
      }
    );
  }

  showPermissionRejectionDialog() {
    console.log(" ");
    console.log("permission request rejected: TODO show user a message");
    Dialogs.alert("Please enable camera permissions to use this feature.");
  }

  changeDate(args: EventData) {
    DateTimePicker.pickDate(
      {
        title: "Select Boy Band Pic Date",
        context: (<Button>args.object)._context,
        date: this.selectedDate,
        // minDate: // min date a user can select, shouldn't need a min date, allow them to select whenever
        maxDate: this.today, // max date a user can select from date picker (year, month, day)
        okButtonText: "Select Date",
        cancelButtonText: "Back",
        locale: "en_GB",
      },
      this.style
    ).then((selected_from_datepicker: Date) => {
      // if a user selects a day, this does not get called if cancelled
      if (selected_from_datepicker) {
        this.selectedDate = selected_from_datepicker;
      }
    });
  }

  openCamera() {
    const options = {
      width: 300,
      height: 300,
      keepAspectRatio: true,
      saveToGallery: false,
    };

    Camera.takePicture(options)
      .then((imageAsset) => {
        this.loadImage(imageAsset);
      })
      .catch((err) => {
        console.log("Error -> " + err.message);
      });
  }

  async loadImage(imageAsset: ImageAsset): Promise<void> {
    if (imageAsset) {
      try {
        const imgSrc = await ImageSource.fromAsset(imageAsset);
        if (imgSrc) {
          this.zone.run(() => {
            this.imageSource = imgSrc;
          });
        } else {
          this.imageSource = null;
          alert("Image source is bad.");
        }
      } catch (error) {
        this.imageSource = null;
        console.log("Error getting image source: ");
        console.error(error);
        alert("Error getting image source from asset");
      }
    } else {
      console.log("Image Asset was null");
      alert("Image Asset was null");
      this.imageSource = null;
    }
  }
  openHistory() {
    console.log("open history");
  }
  openLibrary() {
    this.imagePickerObj = imagePickerPlugin.create({
      mode: "single",
    });
    this.imagePickerObj
      .authorize()
      .then((authResult) => {
        if (authResult.authorized) {
          return this.imagePickerObj.present().then((selection) => {
            selection.forEach((selected) => {
              // console.log("got image!");

              ImageSource.fromAsset(selected.asset)
                .then((source) => {
                  // Now 'source' contains the converted ImageSource
                  // You can use 'source' wherever you need an ImageSource
                  this.imageSource = source;
                })
                .catch((err) => {
                  // Handle error if any
                  console.error(
                    "Error converting ImageAsset to ImageSource:",
                    err
                  );
                });

              //etc
            });
          });
        } else {
          // process authorization not granted.
          console.log("process authorization not granted.");
        }
      })
      .catch(function (e) {
        // process error
        console.log("Error: ", e);
      });
  }

  // takes a screenshot of the screen with the overlay and the original image
  sharePicWithOverlay(args: EventData) {
    console.log("====================================");
    console.log("Taking Screenshot of Camera and Overlay");
    console.log("====================================");

    const view = args.object as View;

    const targetView = view.page.getViewById("imageWithOverlay") as View;

    const screenShot = this.getImage(targetView);

    // let image = ImageSource.fromFile("~/path/to/myImage.jpg");
    const image = screenShot;
    SocialShare.shareImage(image);
  }

  getImage(view: View) {
    if (view.ios) {
      //ios logic
      UIGraphicsBeginImageContextWithOptions(view.ios.frame.size, false, 0);

      view.ios.drawViewHierarchyInRectAfterScreenUpdates(
        CGRectMake(0, 0, view.ios.frame.size.width, view.ios.frame.size.height),
        true
      );
      const imageFromCurrentImageContext =
        UIGraphicsGetImageFromCurrentImageContext();
      UIGraphicsEndImageContext();
      return ImageSource.fromDataSync(
        UIImagePNGRepresentation(imageFromCurrentImageContext)
      );
    } else if (view.android) {
      // todo android logic
    }
    return undefined;
  }

  clearImageSource() {
    this.imageSource = null;
  }

  // shares the original image
  sharePic() {
    console.log("share pic");
    SocialShare.shareImage(this.imageSource);
  }
}
