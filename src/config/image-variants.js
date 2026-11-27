"use strict";
const LOCAL_IMAGE_VARIANTS = {
    "assets/images/categories/beach.jpg":  [
                                               {
                                                   "src":  "assets/images/optimized/categories/beach-480.jpg",
                                                   "width":  480
                                               },
                                               {
                                                   "src":  "assets/images/optimized/categories/beach-960.jpg",
                                                   "width":  768
                                               }
                                           ],
    "assets/images/destinations/spiti.jpg":  [
                                                 {
                                                     "src":  "assets/images/optimized/destinations/spiti-480.jpg",
                                                     "width":  480
                                                 },
                                                 {
                                                     "src":  "assets/images/optimized/destinations/spiti-960.jpg",
                                                     "width":  933
                                                 },
                                                 {
                                                     "src":  "assets/images/optimized/destinations/spiti-1600.jpg",
                                                     "width":  933
                                                 }
                                             ],
    "assets/images/destinations/coorg.jpg":  [
                                                 {
                                                     "src":  "assets/images/optimized/destinations/coorg-480.jpg",
                                                     "width":  480
                                                 },
                                                 {
                                                     "src":  "assets/images/optimized/destinations/coorg-960.jpg",
                                                     "width":  960
                                                 },
                                                 {
                                                     "src":  "assets/images/optimized/destinations/coorg-1600.jpg",
                                                     "width":  1050
                                                 }
                                             ],
    "assets/images/destinations/meghalaya.jpg":  [
                                                     {
                                                         "src":  "assets/images/optimized/destinations/meghalaya-480.jpg",
                                                         "width":  480
                                                     },
                                                     {
                                                         "src":  "assets/images/optimized/destinations/meghalaya-960.jpg",
                                                         "width":  960
                                                     },
                                                     {
                                                         "src":  "assets/images/optimized/destinations/meghalaya-1600.jpg",
                                                         "width":  1400
                                                     }
                                                 ],
    "assets/images/categories/trekking.jpg":  [
                                                  {
                                                      "src":  "assets/images/optimized/categories/trekking-480.jpg",
                                                      "width":  480
                                                  },
                                                  {
                                                      "src":  "assets/images/optimized/categories/trekking-960.jpg",
                                                      "width":  960
                                                  }
                                              ],
    "assets/images/destinations/jaisalmer.jpg":  [
                                                     {
                                                         "src":  "assets/images/optimized/destinations/jaisalmer-480.jpg",
                                                         "width":  480
                                                     },
                                                     {
                                                         "src":  "assets/images/optimized/destinations/jaisalmer-960.jpg",
                                                         "width":  960
                                                     },
                                                     {
                                                         "src":  "assets/images/optimized/destinations/jaisalmer-1600.jpg",
                                                         "width":  1400
                                                     }
                                                 ],
    "assets/images/destinations/andaman.jpg":  [
                                                   {
                                                       "src":  "assets/images/optimized/destinations/andaman-480.jpg",
                                                       "width":  480
                                                   },
                                                   {
                                                       "src":  "assets/images/optimized/destinations/andaman-960.jpg",
                                                       "width":  960
                                                   },
                                                   {
                                                       "src":  "assets/images/optimized/destinations/andaman-1600.jpg",
                                                       "width":  1049
                                                   }
                                               ],
    "assets/images/categories/adventure.jpg":  [
                                                   {
                                                       "src":  "assets/images/optimized/categories/adventure-480.jpg",
                                                       "width":  480
                                                   },
                                                   {
                                                       "src":  "assets/images/optimized/categories/adventure-960.jpg",
                                                       "width":  960
                                                   }
                                               ],
    "assets/images/categories/international.jpg":  [
                                                       {
                                                           "src":  "assets/images/optimized/categories/international-480.jpg",
                                                           "width":  480
                                                       },
                                                       {
                                                           "src":  "assets/images/optimized/categories/international-960.jpg",
                                                           "width":  768
                                                       }
                                                   ],
    "assets/images/destinations/rishikesh.jpg":  [
                                                     {
                                                         "src":  "assets/images/optimized/destinations/rishikesh-480.jpg",
                                                         "width":  480
                                                     },
                                                     {
                                                         "src":  "assets/images/optimized/destinations/rishikesh-960.jpg",
                                                         "width":  933
                                                     },
                                                     {
                                                         "src":  "assets/images/optimized/destinations/rishikesh-1600.jpg",
                                                         "width":  933
                                                     }
                                                 ],
    "assets/images/categories/solo.jpg":  [
                                              {
                                                  "src":  "assets/images/optimized/categories/solo-480.jpg",
                                                  "width":  480
                                              },
                                              {
                                                  "src":  "assets/images/optimized/categories/solo-960.jpg",
                                                  "width":  768
                                              }
                                          ],
    "assets/images/destinations/assam.jpg":  [
                                                 {
                                                     "src":  "assets/images/optimized/destinations/assam-480.jpg",
                                                     "width":  480
                                                 },
                                                 {
                                                     "src":  "assets/images/optimized/destinations/assam-960.jpg",
                                                     "width":  933
                                                 },
                                                 {
                                                     "src":  "assets/images/optimized/destinations/assam-1600.jpg",
                                                     "width":  933
                                                 }
                                             ],
    "assets/images/categories/backpacking.jpg":  [
                                                     {
                                                         "src":  "assets/images/optimized/categories/backpacking-480.jpg",
                                                         "width":  480
                                                     },
                                                     {
                                                         "src":  "assets/images/optimized/categories/backpacking-960.jpg",
                                                         "width":  960
                                                     }
                                                 ],
    "assets/images/categories/all-girls.jpg":  [
                                                   {
                                                       "src":  "assets/images/optimized/categories/all-girls-480.jpg",
                                                       "width":  480
                                                   },
                                                   {
                                                       "src":  "assets/images/optimized/categories/all-girls-960.jpg",
                                                       "width":  768
                                                   }
                                               ],
    "assets/images/destinations/kashmir.jpg":  [
                                                   {
                                                       "src":  "assets/images/optimized/destinations/kashmir-480.jpg",
                                                       "width":  480
                                                   },
                                                   {
                                                       "src":  "assets/images/optimized/destinations/kashmir-960.jpg",
                                                       "width":  788
                                                   },
                                                   {
                                                       "src":  "assets/images/optimized/destinations/kashmir-1600.jpg",
                                                       "width":  788
                                                   }
                                               ],
    "assets/images/categories/weekend.jpg":  [
                                                 {
                                                     "src":  "assets/images/optimized/categories/weekend-480.jpg",
                                                     "width":  480
                                                 },
                                                 {
                                                     "src":  "assets/images/optimized/categories/weekend-960.jpg",
                                                     "width":  960
                                                 }
                                             ],
    "assets/images/destinations/kerala.jpg":  [
                                                  {
                                                      "src":  "assets/images/optimized/destinations/kerala-480.jpg",
                                                      "width":  480
                                                  },
                                                  {
                                                      "src":  "assets/images/optimized/destinations/kerala-960.jpg",
                                                      "width":  960
                                                  },
                                                  {
                                                      "src":  "assets/images/optimized/destinations/kerala-1600.jpg",
                                                      "width":  1400
                                                  }
                                              ]
};
