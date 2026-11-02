/**
 * Atlas Nathan v5 Data - Official clinical masks, regions, and joints
 */

export interface AtlasMask {
  asset: string;
  width: number;
  height: number;
  path: string;
  source?: string;
}

export interface WpiRegion {
  id: string;
  label: string;
  asset: string;
  view: string;
  patient_side: string;
  x: number;
  y: number;
  path: string;
}

export interface Das28Joint {
  id: string;
  label: string;
  asset: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
  patient_side: string;
  view: string;
}

export const ATLAS_MASKS: Record<string, AtlasMask> = {
  "mao-esquerda": {
    "asset": "mao-esquerda",
    "width": 280,
    "height": 401,
    "path": "M 133 25 L 129 28 L 129 46 L 127 44 L 127 31 L 123 55 L 123 88 L 119 109 L 120 158 L 117 164 L 109 166 L 108 169 L 105 164 L 102 145 L 101 117 L 95 87 L 92 48 L 92 58 L 90 60 L 89 43 L 85 41 L 77 42 L 74 45 L 74 58 L 72 56 L 72 50 L 72 127 L 77 157 L 77 184 L 75 210 L 71 223 L 65 234 L 63 231 L 68 220 L 61 202 L 57 197 L 57 187 L 51 174 L 39 160 L 32 157 L 24 158 L 21 165 L 28 180 L 32 182 L 30 184 L 31 204 L 42 230 L 47 258 L 74 303 L 87 318 L 91 326 L 95 389 L 185 389 L 182 322 L 184 314 L 192 299 L 202 266 L 211 219 L 213 192 L 223 163 L 227 139 L 231 129 L 233 113 L 230 118 L 229 116 L 233 104 L 229 100 L 224 100 L 219 115 L 219 104 L 213 119 L 207 144 L 201 155 L 192 187 L 190 189 L 189 186 L 187 186 L 186 190 L 184 187 L 184 164 L 191 133 L 191 110 L 196 82 L 197 58 L 192 50 L 181 50 L 177 54 L 175 61 L 171 98 L 164 123 L 161 160 L 159 168 L 157 170 L 156 168 L 151 168 L 151 172 L 147 162 L 147 134 L 149 122 L 147 78 L 149 65 L 148 34 L 148 40 L 146 43 L 146 29 L 143 26 Z",
    "source": "Dorsal views; interaction schema landmarks separately calibrated"
  },
  "mao-direita": {
    "asset": "mao-direita",
    "width": 288,
    "height": 393,
    "path": "M 140 20 L 134 20 L 128 24 L 128 39 L 126 28 L 125 32 L 125 149 L 124 159 L 121 166 L 120 163 L 115 164 L 114 166 L 112 164 L 107 124 L 99 92 L 96 62 L 93 52 L 93 60 L 91 60 L 90 47 L 88 45 L 79 45 L 75 48 L 75 60 L 73 53 L 74 80 L 79 104 L 79 126 L 88 166 L 88 182 L 86 186 L 84 185 L 84 182 L 82 185 L 78 177 L 72 154 L 65 139 L 54 103 L 49 99 L 43 99 L 40 102 L 41 110 L 45 116 L 43 117 L 40 113 L 40 120 L 47 143 L 49 159 L 59 187 L 61 216 L 70 264 L 78 291 L 89 315 L 87 384 L 176 384 L 180 322 L 184 313 L 196 300 L 225 251 L 231 219 L 240 198 L 242 179 L 239 177 L 245 172 L 250 160 L 250 156 L 246 152 L 239 152 L 231 156 L 221 168 L 215 180 L 213 188 L 214 192 L 203 216 L 207 225 L 206 228 L 197 210 L 194 180 L 194 155 L 201 116 L 201 81 L 203 70 L 202 45 L 202 51 L 200 54 L 200 40 L 194 36 L 187 37 L 184 40 L 184 56 L 182 53 L 182 45 L 179 61 L 178 86 L 172 110 L 167 155 L 164 161 L 157 162 L 156 164 L 153 161 L 152 156 L 153 99 L 150 80 L 150 40 L 148 29 L 147 40 L 143 44 L 141 43 L 145 38 L 146 24 Z",
    "source": "Dorsal views; interaction schema landmarks separately calibrated"
  },
  "pe-esquerdo": {
    "asset": "pe-esquerdo",
    "width": 265,
    "height": 466,
    "path": "M 84 31 L 74 37 L 63 62 L 62 78 L 64 95 L 56 128 L 56 143 L 64 173 L 68 209 L 68 245 L 62 275 L 62 300 L 65 314 L 65 337 L 62 349 L 62 362 L 65 374 L 78 398 L 81 408 L 79 448 L 186 442 L 169 403 L 161 379 L 164 380 L 168 393 L 169 381 L 175 365 L 175 350 L 169 334 L 172 307 L 182 257 L 201 186 L 201 171 L 197 151 L 198 116 L 193 108 L 188 107 L 184 110 L 181 122 L 181 144 L 177 140 L 177 126 L 181 108 L 180 89 L 178 95 L 177 85 L 169 82 L 167 83 L 169 84 L 167 86 L 167 92 L 169 94 L 167 95 L 165 93 L 164 87 L 162 92 L 161 124 L 158 126 L 155 123 L 155 109 L 158 101 L 161 69 L 160 66 L 152 60 L 146 61 L 141 68 L 137 91 L 137 109 L 133 108 L 132 111 L 130 109 L 130 94 L 137 62 L 137 49 L 130 41 L 121 41 L 115 48 L 112 60 L 110 102 L 108 105 L 107 102 L 101 104 L 100 107 L 98 105 L 98 90 L 106 69 L 106 45 L 103 38 L 94 31 Z",
    "source": "Dorsal views; interaction schema landmarks separately calibrated"
  },
  "corpo-posterior": {
    "asset": "corpo-posterior",
    "width": 551,
    "height": 1139,
    "path": "M 291 7 L 274 9 L 258 16 L 245 28 L 235 49 L 233 61 L 234 82 L 230 83 L 227 88 L 227 97 L 236 119 L 244 125 L 251 141 L 252 165 L 248 177 L 239 187 L 214 203 L 192 213 L 172 217 L 157 223 L 140 238 L 134 248 L 127 272 L 129 319 L 119 355 L 112 411 L 99 432 L 89 455 L 83 483 L 80 514 L 75 533 L 61 569 L 39 588 L 18 626 L 20 632 L 27 633 L 40 623 L 32 658 L 31 678 L 35 682 L 39 681 L 44 691 L 50 690 L 53 686 L 60 687 L 68 675 L 70 677 L 77 675 L 87 654 L 98 620 L 101 604 L 100 581 L 116 544 L 145 499 L 155 478 L 160 458 L 162 427 L 176 390 L 183 362 L 204 434 L 203 455 L 194 483 L 193 507 L 176 578 L 170 627 L 171 668 L 174 690 L 182 725 L 192 754 L 196 778 L 194 798 L 196 836 L 184 882 L 183 918 L 209 1031 L 210 1065 L 207 1078 L 208 1096 L 198 1106 L 188 1111 L 184 1115 L 183 1121 L 187 1129 L 200 1138 L 260 1138 L 260 1130 L 254 1107 L 257 1075 L 250 1053 L 248 1026 L 251 989 L 267 927 L 266 898 L 258 864 L 257 846 L 269 797 L 270 723 L 281 668 L 286 610 L 289 603 L 293 609 L 296 658 L 309 727 L 309 797 L 321 847 L 320 864 L 311 901 L 311 931 L 326 986 L 329 1037 L 327 1054 L 320 1077 L 323 1108 L 317 1130 L 317 1138 L 377 1138 L 387 1132 L 394 1122 L 392 1113 L 379 1106 L 369 1095 L 370 1076 L 367 1063 L 367 1043 L 370 1023 L 390 948 L 395 920 L 395 887 L 382 836 L 384 809 L 383 769 L 400 711 L 408 659 L 408 621 L 405 592 L 386 507 L 384 476 L 376 452 L 377 424 L 398 357 L 408 390 L 423 424 L 426 457 L 432 478 L 439 493 L 469 539 L 485 576 L 484 600 L 486 612 L 504 666 L 510 674 L 517 673 L 525 684 L 533 684 L 538 689 L 544 687 L 546 679 L 550 680 L 550 635 L 546 620 L 547 618 L 550 622 L 550 590 L 538 576 L 524 565 L 508 519 L 498 457 L 494 445 L 471 403 L 464 355 L 453 322 L 455 286 L 449 253 L 439 236 L 425 224 L 409 217 L 385 212 L 356 198 L 341 188 L 330 176 L 326 160 L 327 141 L 334 125 L 343 117 L 351 96 L 350 85 L 344 82 L 344 53 L 337 34 L 324 19 L 310 11 Z",
    "source": "segunda arte neutra, membros completos, máscara de alfa nativa"
  },
  "corpo-anterior": {
    "asset": "corpo-anterior",
    "width": 479,
    "height": 984,
    "path": "M 255 14 L 241 14 L 223 21 L 212 32 L 205 47 L 204 75 L 200 77 L 200 83 L 206 100 L 210 101 L 219 120 L 219 140 L 215 151 L 201 163 L 173 178 L 162 182 L 147 184 L 138 188 L 126 198 L 118 211 L 113 228 L 113 250 L 116 271 L 108 297 L 104 334 L 81 379 L 71 442 L 58 475 L 42 488 L 22 521 L 22 523 L 38 523 L 38 532 L 32 558 L 32 570 L 39 571 L 40 578 L 52 576 L 58 568 L 63 568 L 66 565 L 70 557 L 85 514 L 86 484 L 88 476 L 96 459 L 131 400 L 137 376 L 140 343 L 146 334 L 155 302 L 164 301 L 177 353 L 177 368 L 170 399 L 170 418 L 160 452 L 153 488 L 150 514 L 150 548 L 156 585 L 173 641 L 173 675 L 161 714 L 158 745 L 161 768 L 179 840 L 181 867 L 178 876 L 179 897 L 169 920 L 157 939 L 156 947 L 164 955 L 174 959 L 180 959 L 184 962 L 206 961 L 211 954 L 213 946 L 213 932 L 216 918 L 214 906 L 216 877 L 210 860 L 209 838 L 214 803 L 226 761 L 226 741 L 220 712 L 219 694 L 225 672 L 229 645 L 229 595 L 239 547 L 241 513 L 254 514 L 256 552 L 266 597 L 264 621 L 265 643 L 269 672 L 275 693 L 275 707 L 268 742 L 268 761 L 280 804 L 285 836 L 285 855 L 278 880 L 281 894 L 279 924 L 282 950 L 288 961 L 298 962 L 321 959 L 325 955 L 330 955 L 338 948 L 337 938 L 326 921 L 316 899 L 317 880 L 314 870 L 314 847 L 316 835 L 333 770 L 337 743 L 334 714 L 322 675 L 322 638 L 339 580 L 344 544 L 344 516 L 340 480 L 333 445 L 324 415 L 324 392 L 318 367 L 318 353 L 327 317 L 330 313 L 331 301 L 340 302 L 340 312 L 343 313 L 347 328 L 354 343 L 359 383 L 364 400 L 398 457 L 407 476 L 410 514 L 428 564 L 432 568 L 437 568 L 441 575 L 454 578 L 455 571 L 462 569 L 463 561 L 456 530 L 456 522 L 465 521 L 470 523 L 470 517 L 455 491 L 437 475 L 433 468 L 421 430 L 414 380 L 392 337 L 386 291 L 379 270 L 382 250 L 382 228 L 377 210 L 371 200 L 358 188 L 346 183 L 334 182 L 317 175 L 289 159 L 280 150 L 277 142 L 277 120 L 285 102 L 290 100 L 296 82 L 296 77 L 292 75 L 292 52 L 289 41 L 281 28 L 270 19 Z",
    "source": "manual review pending for clinical hotspot geometry"
  },
  "pe-direito": {
    "asset": "pe-direito",
    "width": 234,
    "height": 456,
    "path": "M 139 21 L 129 21 L 124 23 L 119 28 L 116 36 L 117 64 L 125 83 L 125 92 L 122 97 L 121 94 L 117 93 L 116 96 L 113 91 L 112 66 L 108 39 L 103 32 L 93 31 L 86 39 L 86 51 L 93 85 L 92 99 L 88 101 L 86 99 L 86 78 L 82 56 L 78 51 L 71 50 L 65 54 L 66 64 L 63 58 L 63 74 L 69 102 L 68 114 L 65 117 L 63 116 L 62 81 L 60 75 L 55 72 L 51 72 L 47 75 L 46 85 L 44 79 L 43 100 L 47 127 L 42 134 L 42 112 L 39 100 L 35 97 L 31 97 L 27 100 L 24 107 L 25 141 L 21 160 L 21 176 L 23 189 L 41 252 L 50 297 L 52 325 L 47 340 L 47 356 L 54 376 L 54 385 L 54 383 L 57 382 L 35 434 L 143 440 L 141 425 L 141 397 L 154 372 L 160 354 L 157 309 L 161 285 L 161 264 L 155 235 L 154 205 L 158 166 L 166 135 L 166 116 L 159 91 L 159 52 L 151 32 L 145 24 Z",
    "source": "Dorsal views; interaction schema landmarks separately calibrated"
  }
};

export const WPI19_REGIONS: WpiRegion[] = [
  {
    "id": "jaw_R",
    "label": "Mandíbula direita",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "direita",
    "x": 257,
    "y": 149,
    "path": "M 242 126 L 258 128 L 270 151 L 269 173 L 254 165 L 248 150 Z"
  },
  {
    "id": "jaw_L",
    "label": "Mandíbula esquerda",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "esquerda",
    "x": 318,
    "y": 148,
    "path": "M 315 128 L 331 126 L 329 149 L 320 164 L 308 173 L 307 151 Z"
  },
  {
    "id": "upper_arm_R",
    "label": "Braço direito",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "direita",
    "x": 136,
    "y": 398,
    "path": "M 120 349 L 141 346 L 158 358 L 157 405 L 145 455 L 122 452 L 111 423 Z"
  },
  {
    "id": "upper_arm_L",
    "label": "Braço esquerdo",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "esquerda",
    "x": 442,
    "y": 399,
    "path": "M 418 355 L 437 345 L 456 350 L 467 416 L 461 449 L 438 455 L 420 421 Z"
  },
  {
    "id": "lower_arm_R",
    "label": "Antebraço direito",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "direita",
    "x": 100,
    "y": 538,
    "path": "M 98 469 L 126 471 L 136 489 L 116 543 L 91 607 L 62 620 L 70 570 Z"
  },
  {
    "id": "lower_arm_L",
    "label": "Antebraço esquerdo",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "esquerda",
    "x": 475,
    "y": 547,
    "path": "M 439 470 L 465 469 L 480 500 L 500 585 L 508 620 L 477 623 L 455 559 Z"
  },
  {
    "id": "upper_leg_R",
    "label": "Coxa direita",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "direita",
    "x": 214,
    "y": 727,
    "path": "M 196 597 L 232 608 L 250 665 L 254 736 L 248 812 L 221 844 L 187 825 L 167 769 L 167 685 Z"
  },
  {
    "id": "upper_leg_L",
    "label": "Coxa esquerda",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "esquerda",
    "x": 363,
    "y": 732,
    "path": "M 354 600 L 379 606 L 398 668 L 408 751 L 402 795 L 374 830 L 344 844 L 324 821 L 319 746 L 325 660 Z"
  },
  {
    "id": "lower_leg_R",
    "label": "Perna direita",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "direita",
    "x": 212,
    "y": 995,
    "path": "M 196 908 L 216 908 L 241 931 L 253 979 L 246 1046 L 229 1111 L 203 1119 L 188 1040 L 172 975 L 179 932 Z"
  },
  {
    "id": "lower_leg_L",
    "label": "Perna esquerda",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "esquerda",
    "x": 356,
    "y": 997,
    "path": "M 346 919 L 372 909 L 389 931 L 399 974 L 381 1051 L 366 1111 L 340 1113 L 322 1048 L 318 976 L 327 942 Z"
  },
  {
    "id": "chest",
    "label": "Tórax anterior",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "central",
    "x": 283,
    "y": 319,
    "path": "M 202 260 L 239 265 L 281 273 L 294 266 L 327 263 L 373 264 L 401 306 L 390 345 L 360 375 L 316 378 L 290 357 L 279 379 L 231 378 L 198 364 L 175 329 L 178 299 Z"
  },
  {
    "id": "abdomen",
    "label": "Abdome",
    "asset": "wpi-anterior",
    "view": "anterior",
    "patient_side": "central",
    "x": 284,
    "y": 498,
    "path": "M 257 387 L 304 387 L 340 414 L 356 459 L 374 525 L 351 575 L 306 601 L 261 604 L 221 571 L 197 544 L 210 484 L 227 419 Z"
  },
  {
    "id": "shoulder_girdle_R",
    "label": "Cintura escapular direita",
    "asset": "wpi-posterior",
    "view": "posterior",
    "patient_side": "direita",
    "x": 385,
    "y": 290,
    "path": "M 350 248 L 390 246 L 415 275 L 421 322 L 400 341 L 374 316 L 348 281 Z"
  },
  {
    "id": "shoulder_girdle_L",
    "label": "Cintura escapular esquerda",
    "asset": "wpi-posterior",
    "view": "posterior",
    "patient_side": "esquerda",
    "x": 118,
    "y": 294,
    "path": "M 107 246 L 146 248 L 164 282 L 136 332 L 105 342 L 83 329 L 82 282 Z"
  },
  {
    "id": "hip_R",
    "label": "Quadril/nádega direita",
    "asset": "wpi-posterior",
    "view": "posterior",
    "patient_side": "direita",
    "x": 318,
    "y": 629,
    "path": "M 277 552 L 315 550 L 349 581 L 365 625 L 358 679 L 321 702 L 285 693 L 270 650 Z"
  },
  {
    "id": "hip_L",
    "label": "Quadril/nádega esquerda",
    "asset": "wpi-posterior",
    "view": "posterior",
    "patient_side": "esquerda",
    "x": 196,
    "y": 627,
    "path": "M 184 552 L 221 551 L 238 598 L 241 665 L 225 692 L 191 702 L 158 684 L 146 622 L 156 577 Z"
  },
  {
    "id": "upper_back",
    "label": "Região dorsal",
    "asset": "wpi-posterior",
    "view": "posterior",
    "patient_side": "central",
    "x": 248,
    "y": 323,
    "path": "M 166 251 L 204 259 L 240 277 L 258 287 L 271 277 L 311 260 L 347 252 L 339 316 L 317 381 L 277 418 L 259 423 L 223 413 L 191 387 L 165 348 L 157 296 Z"
  },
  {
    "id": "lower_back",
    "label": "Região lombar",
    "asset": "wpi-posterior",
    "view": "posterior",
    "patient_side": "central",
    "x": 264,
    "y": 491,
    "path": "M 194 435 L 233 430 L 262 448 L 291 428 L 324 446 L 352 491 L 346 541 L 315 546 L 274 541 L 236 544 L 177 543 L 167 496 Z"
  },
  {
    "id": "neck",
    "label": "Região cervical",
    "asset": "wpi-posterior",
    "view": "posterior",
    "patient_side": "central",
    "x": 258,
    "y": 205,
    "path": "M 227 143 L 285 143 L 291 194 L 317 235 L 291 247 L 226 246 L 201 238 L 222 197 Z"
  }
];

export const DAS28_JOINTS: Das28Joint[] = [
  {
    "id": "shoulder_R",
    "label": "Ombro direito",
    "asset": "corpo-anterior",
    "x": 145,
    "y": 226,
    "rx": 16,
    "ry": 16,
    "patient_side": "direita",
    "view": "anterior"
  },
  {
    "id": "shoulder_L",
    "label": "Ombro esquerdo",
    "asset": "corpo-anterior",
    "x": 365,
    "y": 226,
    "rx": 16,
    "ry": 16,
    "patient_side": "esquerda",
    "view": "anterior"
  },
  {
    "id": "elbow_R",
    "label": "Cotovelo direito",
    "asset": "corpo-anterior",
    "x": 118,
    "y": 378,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "anterior"
  },
  {
    "id": "elbow_L",
    "label": "Cotovelo esquerdo",
    "asset": "corpo-anterior",
    "x": 392,
    "y": 378,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "anterior"
  },
  {
    "id": "wrist_R",
    "label": "Punho direito",
    "asset": "corpo-anterior",
    "x": 75,
    "y": 498,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "anterior"
  },
  {
    "id": "wrist_L",
    "label": "Punho esquerdo",
    "asset": "corpo-anterior",
    "x": 424,
    "y": 498,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "anterior"
  },
  {
    "id": "knee_R",
    "label": "Joelho direito",
    "asset": "corpo-anterior",
    "x": 207,
    "y": 642,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "anterior"
  },
  {
    "id": "knee_L",
    "label": "Joelho esquerdo",
    "asset": "corpo-anterior",
    "x": 303,
    "y": 642,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "anterior"
  },
  {
    "id": "mcp1_R",
    "label": "Metacarpofalângica 1, mão direita",
    "asset": "mao-direita",
    "x": 219,
    "y": 217,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "mcp2_R",
    "label": "Metacarpofalângica 2, mão direita",
    "asset": "mao-direita",
    "x": 190,
    "y": 187,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "mcp3_R",
    "label": "Metacarpofalângica 3, mão direita",
    "asset": "mao-direita",
    "x": 143,
    "y": 186,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "mcp4_R",
    "label": "Metacarpofalângica 4, mão direita",
    "asset": "mao-direita",
    "x": 102,
    "y": 186,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "mcp5_R",
    "label": "Metacarpofalângica 5, mão direita",
    "asset": "mao-direita",
    "x": 65,
    "y": 198,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "pip1_R",
    "label": "Interfalângica do polegar 1, mão direita",
    "asset": "mao-direita",
    "x": 234,
    "y": 174,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "pip2_R",
    "label": "Interfalângica proximal 2, mão direita",
    "asset": "mao-direita",
    "x": 190,
    "y": 124,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "pip3_R",
    "label": "Interfalângica proximal 3, mão direita",
    "asset": "mao-direita",
    "x": 138,
    "y": 110,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "pip4_R",
    "label": "Interfalângica proximal 4, mão direita",
    "asset": "mao-direita",
    "x": 89,
    "y": 126,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "pip5_R",
    "label": "Interfalângica proximal 5, mão direita",
    "asset": "mao-direita",
    "x": 54,
    "y": 158,
    "rx": 14,
    "ry": 14,
    "patient_side": "direita",
    "view": "dorsal"
  },
  {
    "id": "mcp1_L",
    "label": "Metacarpofalângica 1, mão esquerda",
    "asset": "mao-esquerda",
    "x": 48,
    "y": 220,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "mcp2_L",
    "label": "Metacarpofalângica 2, mão esquerda",
    "asset": "mao-esquerda",
    "x": 93,
    "y": 190,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "mcp3_L",
    "label": "Metacarpofalângica 3, mão esquerda",
    "asset": "mao-esquerda",
    "x": 137,
    "y": 186,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "mcp4_L",
    "label": "Metacarpofalângica 4, mão esquerda",
    "asset": "mao-esquerda",
    "x": 178,
    "y": 192,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "mcp5_L",
    "label": "Metacarpofalângica 5, mão esquerda",
    "asset": "mao-esquerda",
    "x": 204,
    "y": 202,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "pip1_L",
    "label": "Interfalângica do polegar 1, mão esquerda",
    "asset": "mao-esquerda",
    "x": 37,
    "y": 184,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "pip2_L",
    "label": "Interfalângica proximal 2, mão esquerda",
    "asset": "mao-esquerda",
    "x": 87,
    "y": 126,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "pip3_L",
    "label": "Interfalângica proximal 3, mão esquerda",
    "asset": "mao-esquerda",
    "x": 135,
    "y": 109,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "pip4_L",
    "label": "Interfalângica proximal 4, mão esquerda",
    "asset": "mao-esquerda",
    "x": 184,
    "y": 128,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  },
  {
    "id": "pip5_L",
    "label": "Interfalângica proximal 5, mão esquerda",
    "asset": "mao-esquerda",
    "x": 214,
    "y": 157,
    "rx": 14,
    "ry": 14,
    "patient_side": "esquerda",
    "view": "dorsal"
  }
];
