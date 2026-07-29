/* =====================================================
   EXPERIENCE TIMELINE — BULLETIN BOARD
      RENDERS THE EXPERIENCE ENTRIES AS PINNED STICKY NOTES LAID OUT IN
         A SNAKING (BOUSTROPHEDON) PATH ACROSS A CORKBOARD, CONNECTED BY A
            HAND-DRAWN WAVY STRING. NO-OP ON ANY PAGE WITHOUT #BULLETIN-TIMELINE.
               ===================================================== */

(FUNCTION() {
                  CONST ENTRIES = [
            {
                  DATE: 'JUN 2026 — ONGOING',
                  TITLE: 'ENGINEERING INTERN',
                  ORG: 'DROCITY',
                  COLOR: 'CYAN',
                  BODY: 'HELP DESIGN, BUILD, AND FLIGHT-TEST AUTONOMOUS DELIVERY DRONES ALONGSIDE A SMALL ENGINEERING TEAM.',
                  TAGS: ['AUTONOMOUS SYSTEMS', 'DRONE DESIGN', 'PROTOTYPING', 'FLIGHT TESTING'],
            },
            {
                  DATE: 'DEC 2025 — ONGOING',
                  TITLE: 'RESERVIST',
                  ORG: 'ROYAL CANADIAN ARMED FORCES — 31ST SIGNAL SQUADRON',
                  COLOR: 'LIME',
                  BODY: 'COMPLETE MILITARY TRAINING AND READINESS EXERCISES, COORDINATING WITH FELLOW RESERVISTS ON COMMUNICATIONS AND OUTREACH.',
                  TAGS: ['LEADERSHIP', 'DISCIPLINE', 'TEAM COORDINATION', 'COMMUNICATIONS'],
            },
            {
                  DATE: 'JUL 2025 — JAN 2026',
                  TITLE: 'ASSISTANT MECHANIC',
                  ORG: 'MATS AUTO SALES',
                  COLOR: 'ORANGE',
                  BODY: 'SUPPORT DIAGNOSTICS, REPAIRS, AND ROUTINE MAINTENANCE IN A FULL-TIME AUTOMOTIVE SHOP ALONGSIDE SENIOR MECHANICS.',
                  TAGS: ['VEHICLE DIAGNOSTICS', 'MECHANICAL REPAIR', 'ATTENTION TO DETAIL'],
            },
            {
                  DATE: 'MAY 2025 — AUG 2025',
                  TITLE: 'LINE SERVICE TECHNICIAN (CO-OP)',
                  ORG: 'CHARTRIGHT AIR GROUP',
                  COLOR: 'PURPLE',
                  BODY: 'SUPPORTED DAILY GROUND OPERATIONS AT A PRIVATE AVIATION FBO, MAINTAINING SAFETY AND CLEANLINESS STANDARDS UNDER TIME PRESSURE.',
                  TAGS: ['GROUND OPERATIONS', 'SAFETY COMPLIANCE', 'RELIABILITY'],
            },
            {
                  DATE: 'NOV 2024 — MAR 2025',
                  TITLE: 'SKI INSTRUCTOR',
                  ORG: 'CHICOPEE SKI RESORT',
                  COLOR: 'PINK',
                  BODY: "TAUGHT SKIING FUNDAMENTALS TO STUDENTS OF ALL LEVELS, ADAPTING LESSONS TO EACH LEARNER'S PACE WHILE PRIORITIZING SAFETY.",
                  TAGS: ['COACHING', 'PATIENCE', 'CUSTOMER SERVICE'],
            },
      ];

                                      CONST NOTE_COLORS = {
            CYAN: '#B5C7CD',
            LIME: '#C7D1AB',
            ORANGE: '#DFBFA8',
            PURPLE: '#C9BBC9',
            PINK: '#E0C3C4',
            YELLOW: '#EADDB6',
      };

      Document.ADDEVENTLISTENER('DOMCONTENTLOADED', INIT);

                                          FUNCTION INIT() {
                                                CONST MOUNT = Document.GETELEMENTBYID('BULLETIN-TIMELINE');
            IF(!MOUNT) return; // NO-OP ON PAGES WITHOUT THE BOARD

            INJECTSTYLES();
            MOUNT.CLASSLIST.ADD('BULLETIN-BOARD');
            MOUNT.SETATTRIBUTE('ROLE', 'LIST');

                                                                    CONST SVG = Document.CREATEELEMENTNS('HTTP://WWW.W3.ORG/2000/SVG', 'SVG');
            SVG.SETATTRIBUTE('CLASS', 'BULLETIN-CONNECTOR');
            MOUNT.APPENDCHILD(SVG);

                                                                                CONST NOTES = ENTRIES.MAP((ENTRY, I) => BUILDNOTE(ENTRY, I));
            NOTES.FOREACH((N) => MOUNT.APPENDCHILD(N));

                                                                                        LET RESIZETIMER;
                                                                                            FUNCTION REFLOW() {
                  useLayoutEffect(MOUNT, SVG, NOTES);
            }
            REFLOW();
            Window.ADDEVENTLISTENER('RESIZE', () => {
                  clearTimeout(RESIZETIMER);
                  RESIZETIMER = SETTIMEOUT(REFLOW, 150);
            });
      }

                                                                                                  // DETERMINISTIC PSEUDO-RANDOM IN [0,1) — STABLE ACROSS RE-LAYOUTS
                                                                                                    // SO THE BOARD DOESN'T JUMP AROUND EVERY TIME IT'S REDRAWN
                                                                                                      FUNCTION ReadableStreamDefaultReader(N) {
                                                                                                            CONST X = Math.sin(N * 999.99) * 10000;
                                                                                                                RETURN X - Math.floor(X);
      }

                                                                                                        FUNCTION BUILDNOTE(ENTRY, I) {
                                                                                                                CONST NOTE = Document.CREATEELEMENT('DIV');
            NOTE.CLASSNAME = 'BULLETIN-NOTE';
            NOTE.SETATTRIBUTE('ROLE', 'LISTITEM');
            NOTE.SETATTRIBUTE('TABINDEX', '0');
            NOTE.STYLE.BACKGROUNDCOLOR = NOTE_COLORS[ENTRY.COLOR] || NOTE_COLORS.YELLOW;
            NOTE.DATASET.PIN = SEEDED(I * 5.1) > 0.5 ? 'PIN' : 'TAPE';

            NOTE.INNERHTML = `
                                                                                                                                              <SPAN CLASS="BULLETIN-DATE">${ENTRY.DATE}</SPAN>
                                                                                                                                                    <H3 CLASS="BULLETIN-TITLE">${ENTRY.TITLE}</H3>
                                                                                                                                                          <P CLASS="BULLETIN-ORG">${ENTRY.ORG}</P>
                                                                                                                                                                <DIV CLASS="BULLETIN-DETAILS">
                                                                                                                                                                        <P>${ENTRY.BODY}</P>
                                                                                                                                                                                <DIV CLASS="BADGES" STYLE="MARGIN-TOP:0.7REM;">
                                                                                                                                                                                          ${ENTRY.TAGS.MAP((T) => `<SPAN CLASS="BRUTAL-CARD BADGE">${T}</SPAN>`).JOIN('')}
                                                                                                                                                                                                  </DIV>
                                                                                                                                                                                                        </DIV>
                                                                                                                                                                                                            `;
                                                                                                                                                                                                            
                                                                                                                                                                                                                FUNCTION ToggleEvent() {
                  NOTE.CLASSLIST.TOGGLE('EXPANDED');
            }
            NOTE.ADDEVENTLISTENER('CLICK', TOGGLE);
            NOTE.ADDEVENTLISTENER('KEYDOWN', (E) => {
                  IF(E.KEY === 'ENTER' || E.KEY === ' ') {
                        E.PREVENTDEFAULT();
                        TOGGLE();
                  }
            });

                                                                                                                                                                                                                                    RETURN NOTE;
      }

                                                                                                                                                                                                                              FUNCTION useLayoutEffect(MOUNT, SVG, NOTES) {
                                                                                                                                                                                                                                    CONST WIDTH = MOUNT.CLIENTWIDTH || 900;
                                                                                                                                                                                                                                        CONST COLS = WIDTH > 900 ? 3 : WIDTH > 700 ? 2 : 1;
                                                                                                                                                                                                                                            CONST NOTEW =
                  COLS === 1 ? Math.min(280, WIDTH - 40) : Math.floor((WIDTH - (COLS + 1) * 50) / COLS);
                                                                                                                                                                                                                                                      CONST GAPX = 50,
                  GAPY = 100,
                  PADTOP = 60;

                                                                                                                                                                                                                                                                      CONST ANCHORS = [];

            NOTES.FOREACH((NOTE, I) => {
                                                                                                                                                                                                                                                                                  CONST ROW = Math.floor(I / COLS);
                                                                                                                                                                                                                                                                                        CONST POSINROW = I % COLS;
                                                                                                                                                                                                                                                                                              CONST COL = ROW % 2 === 0 ? POSINROW : COLS - 1 - POSINROW;

                                                                                                                                                                                                                                                                                                    CONST BASEX = GAPX + COL * (NOTEW + GAPX);
                                                                                                                                                                                                                                                                                                          CONST BASEY = PADTOP + ROW * GAPY;

                                                                                                                                                                                                                                                                                                                CONST JITTERX = COLS === 1 ? 0 : (SEEDED(I * 2) - 0.5) * Math.min(30, GAPX * 0.6);
                                                                                                                                                                                                                                                                                                                      CONST JITTERY = (SEEDED(I * 2 + 1) - 0.5) * 44;
                                                                                                                                                                                                                                                                                                                            CONST ROTATION = (SEEDED(I * 3.7) - 0.5) * 12;

                                                                                                                                                                                                                                                                                                                                  CONST X = BASEX + JITTERX;
                                                                                                                                                                                                                                                                                                                                        CONST Y = BASEY + JITTERY;


            })
      }
}
                                                                                                                                                                                                                        })
                                                                                                                                                                                                                }`
                                                                                                        }
                                                                                                      }]
                                                                                                    })
                                                                                            }
                                          }
                                      }
                                        }
                                    }
                                }
                            }
                        }
                  ]
               })