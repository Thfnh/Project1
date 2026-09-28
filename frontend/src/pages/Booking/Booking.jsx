import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  CalendarDays,
  LoaderCircle,
  MapPin,
  Search,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import Navbar from "../../components/Navbar/Navbar";

import fieldImage
  from "../../assets/images/football-field.jpg";

import {
  getAllFieldsAvailability,
} from "../../services/field_service";

import "./Booking.css";


const getToday = () => {

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const formatPrice = (value) =>
  Number(
    value || 0
  ).toLocaleString("vi-VN");


function Booking() {

  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();


  // nhận FieldID từ nút Chọn sân
  const initialFieldID =
    Number(
      searchParams.get("fieldId") || 0
    );


  // nhận ngày từ danh sách sân
  const initialDate =
    searchParams.get("date")
    ||
    getToday();


  const [fields, setFields] =
    useState([]);

  const [
    selectedField,
    setSelectedField
  ] = useState(
    initialFieldID || null
  );

  const [
    selectedSlot,
    setSelectedSlot
  ] = useState(null);

  const [
    bookingDate,
    setBookingDate
  ] = useState(
    initialDate
  );

  const [keyword, setKeyword] =
    useState("");

  const [type, setType] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* =========================================================
     LOAD AVAILABILITY
  ========================================================= */

  useEffect(() => {

    loadAvailability(
      bookingDate
    );

  }, [bookingDate]);


  const loadAvailability =
    async (date) => {

      try {

        setLoading(true);
        setError("");
        setSelectedSlot(null);

        const data =
          await getAllFieldsAvailability(
            date
          );

        const result =
          Array.isArray(data)
            ? data
            : data.Fields || [];

        setFields(
          result
        );


        setSelectedField(
          current => {

            // giữ sân đang chọn nếu còn tồn tại
            if (
              current
              &&
              result.some(
                field =>
                  Number(
                    field.FieldID
                  )
                  ===
                  Number(current)
              )
            ) {

              return current;
            }


            // ưu tiên FieldID từ URL
            if (
              initialFieldID
              &&
              result.some(
                field =>
                  Number(
                    field.FieldID
                  )
                  ===
                  Number(
                    initialFieldID
                  )
              )
            ) {

              return initialFieldID;
            }


            return (
              result[0]?.FieldID
              ||
              null
            );
          }
        );

      } catch (
      loadError
      ) {

        console.error(
          loadError
        );

        setError(
          loadError.message
          ||
          "Không thể tải lịch sân"
        );

      } finally {

        setLoading(false);
      }
    };


  /* =========================================================
     FILTER
  ========================================================= */

  const filteredFields =
    useMemo(
      () => {

        const search =
          keyword
            .trim()
            .toLowerCase();

        return fields.filter(
          field => {

            const matchName =
              String(
                field.FieldName || ""
              )
                .toLowerCase()
                .includes(
                  search
                );


            const matchType =
              type === "all"
              ||
              field.FieldType
              ===
              type;


            return (
              matchName
              &&
              matchType
            );
          }
        );

      },
      [
        fields,
        keyword,
        type
      ]
    );


  const fieldTypes =
    useMemo(
      () => [

        ...new Set(

          fields
            .map(
              field =>
                field.FieldType
            )
            .filter(Boolean)
        )
      ],
      [fields]
    );


  const currentField =
    fields.find(
      field =>
        Number(
          field.FieldID
        )
        ===
        Number(
          selectedField
        )
    );


  /* =========================================================
     SELECT FIELD
  ========================================================= */

  const handleSelectField =
    (fieldID) => {

      setSelectedField(
        fieldID
      );

      setSelectedSlot(
        null
      );
    };


  /* =========================================================
     SELECT SLOT
  ========================================================= */

  const handleSelectSlot =
    (slot) => {

      if (
        !slot.available
      ) {

        return;
      }


      setSelectedSlot(
        slot
      );
    };


  /* =========================================================
     CONTINUE PAYMENT
  ========================================================= */

  const handleContinue =
    () => {

      if (
        !currentField
        ||
        !selectedSlot
      ) {

        return;
      }


      const bookingDraft = {

        FieldID:
          currentField.FieldID,

        FieldName:
          currentField.FieldName,

        FieldType:
          currentField.FieldType,

        Location:
          currentField.Location,

        BookingDate:
          bookingDate,

        PriceID:
          selectedSlot.PriceID,

        StartTime:
          selectedSlot.StartTime,

        EndTime:
          selectedSlot.EndTime,

        Price:
          Number(
            selectedSlot.Price || 0
          )
      };


      // lưu lại phòng trường hợp refresh trang payment
      localStorage.setItem(
        "bookingDraft",
        JSON.stringify(
          bookingDraft
        )
      );


      navigate(
        "/payment",
        {
          state: {
            bookingDraft
          }
        }
      );
    };


  return (

    <>

      <Navbar />


      <main
        className="booking-page"
      >

        {/* FILTER */}

        <section
          className="booking-filter"
        >

          <div
            className="
              booking-container
              filter-grid
            "
          >

            <div
              className="
                filter-group
                search-group
              "
            >

              <label>
                TÊN SÂN
              </label>


              <div
                className="search-input"
              >

                <Search
                  size={18}
                />


                <input

                  type="text"

                  placeholder="Nhập tên sân..."

                  value={
                    keyword
                  }

                  onChange={
                    event =>
                      setKeyword(
                        event.target.value
                      )
                  }

                />

              </div>

            </div>


            <div
              className="filter-group"
            >

              <label>
                NGÀY ĐẶT
              </label>


              <input

                className="
                  booking-date-input
                "

                type="date"

                min={
                  getToday()
                }

                value={
                  bookingDate
                }

                onChange={
                  event =>
                    setBookingDate(
                      event.target.value
                    )
                }

              />

            </div>


            <div
              className="filter-group"
            >

              <label>
                LOẠI SÂN
              </label>


              <select

                value={
                  type
                }

                onChange={
                  event =>
                    setType(
                      event.target.value
                    )
                }

              >

                <option value="all">
                  Tất cả loại sân
                </option>


                {
                  fieldTypes.map(
                    fieldType => (

                      <option

                        key={
                          fieldType
                        }

                        value={
                          fieldType
                        }

                      >

                        {
                          fieldType
                        }

                      </option>

                    )
                  )
                }

              </select>

            </div>


            <button

              type="button"

              className="search-btn"

              onClick={
                () =>
                  loadAvailability(
                    bookingDate
                  )
              }

            >

              <Search
                size={18}
              />

              Tải lại lịch

            </button>

          </div>

        </section>


        {/* CONTENT */}

        <section
          className="booking-content"
        >

          <div
            className="
              booking-container
              booking-layout
            "
          >

            {/* LEFT FIELD LIST */}

            <aside
              className="field-sidebar"
            >

              <h3>
                CHỌN SÂN
              </h3>


              <div
                className="field-list"
              >

                {
                  filteredFields.map(
                    field => (

                      <button

                        key={
                          field.FieldID
                        }

                        type="button"

                        className={
                          Number(
                            selectedField
                          )
                            ===
                            Number(
                              field.FieldID
                            )

                            ? "field-item active"

                            : "field-item"
                        }

                        onClick={
                          () =>
                            handleSelectField(
                              field.FieldID
                            )
                        }

                      >

                        <img
                          src={
                            fieldImage
                          }
                          alt={
                            field.FieldName
                          }
                        />


                        <div>

                          <strong>
                            {
                              field.FieldName
                            }
                          </strong>

                          <span>
                            {
                              field.FieldType
                            }
                          </span>

                          <span>
                            {
                              field.AvailableCount
                            }
                            {" "}khung giờ trống
                          </span>

                        </div>

                      </button>

                    )
                  )
                }

              </div>

            </aside>


            {/* RIGHT */}

            <div
              className="booking-main"
            >

              {
                loading
                  ? (

                    <div
                      className="
                      booking-state-card
                    "
                    >

                      <LoaderCircle
                        size={30}
                      />

                      <h2>
                        Đang tải lịch sân...
                      </h2>

                    </div>

                  )
                  : error
                    ? (

                      <div
                        className="
                        booking-state-card
                      "
                      >

                        <h2>
                          Không thể tải lịch sân
                        </h2>

                        <p>
                          {error}
                        </p>

                      </div>

                    )
                    : currentField
                      ? (

                        <>

                          {/* HEADER */}

                          <div
                            className="
                            booking-header-card
                          "
                          >

                            <div>

                              <h1>
                                CHỌN KHUNG GIỜ
                              </h1>


                              <div
                                className="
                                booking-meta
                              "
                              >

                                <span>

                                  Sân:

                                  <strong>
                                    {" "}
                                    {
                                      currentField
                                        .FieldName
                                    }
                                  </strong>

                                </span>


                                <span>

                                  Loại:

                                  <strong>
                                    {" "}
                                    {
                                      currentField
                                        .FieldType
                                    }
                                  </strong>

                                </span>


                                <span>

                                  <MapPin
                                    size={14}
                                  />

                                  {
                                    currentField
                                      .Location
                                  }

                                </span>

                              </div>

                            </div>


                            <div
                              className="date-btn"
                            >

                              <CalendarDays
                                size={18}
                              />

                              {
                                bookingDate
                              }

                            </div>

                          </div>


                          {/* SLOT */}

                          <div
                            className="schedule-card"
                          >

                            <div
                              className="
                              schedule-head
                            "
                            >

                              <div>
                                KHUNG GIỜ
                              </div>

                              <div>
                                GIÁ
                              </div>

                              <div>
                                TRẠNG THÁI
                              </div>

                            </div>


                            {
                              (
                                currentField
                                  .Slots
                                ||
                                []
                              ).map(
                                slot => {

                                  const isSelected =
                                    selectedSlot
                                      ?.PriceID
                                    ===
                                    slot.PriceID;


                                  const disabled =
                                    !slot.available;


                                  return (

                                    <button

                                      key={
                                        slot.PriceID
                                      }

                                      type="button"

                                      disabled={
                                        disabled
                                      }

                                      className={
                                        `schedule-row ${isSelected
                                          ? "selected"
                                          : ""
                                        } ${disabled
                                          ? "disabled"
                                          : ""
                                        }`
                                      }

                                      onClick={
                                        () =>
                                          handleSelectSlot(
                                            slot
                                          )
                                      }

                                    >

                                      <div>

                                        {
                                          slot.StartTime
                                        }

                                        {" - "}

                                        {
                                          slot.EndTime
                                        }

                                      </div>


                                      <div>

                                        {
                                          formatPrice(
                                            slot.Price
                                          )
                                        }

                                        đ

                                      </div>


                                      <div
                                        className={
                                          slot.available
                                            ? "status-cell available"
                                            : "status-cell booked"
                                        }
                                      >

                                        {
                                          slot.available
                                            ? "Trống"
                                            : slot.reason
                                              ===
                                              "FIELD_UNAVAILABLE"
                                              ? "Bảo trì"
                                              : "Đã đặt"
                                        }

                                      </div>

                                    </button>

                                  );
                                }
                              )
                            }

                          </div>


                          {/* BOTTOM */}

                          <div
                            className="booking-bottom"
                          >

                            <div>

                              {
                                selectedSlot
                                &&
                                (

                                  <strong>

                                    Tạm tính:{" "}

                                    {
                                      formatPrice(
                                        selectedSlot.Price
                                      )
                                    }

                                    đ

                                  </strong>

                                )
                              }

                            </div>


                            <button

                              type="button"

                              className="
                              continue-btn
                            "

                              disabled={
                                !selectedSlot
                              }

                              onClick={
                                handleContinue
                              }

                            >

                              Tiếp tục thanh toán

                              <ArrowRight
                                size={19}
                              />

                            </button>

                          </div>

                        </>

                      )
                      : (

                        <div>
                          Không tìm thấy sân.
                        </div>

                      )
              }

            </div>

          </div>

        </section>

      </main>

    </>
  );
}


export default Booking;