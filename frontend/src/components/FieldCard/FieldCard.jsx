import {
  useNavigate
} from "react-router-dom";

import {
  CalendarDays,
  MapPin,
  Users
} from "lucide-react";

import fieldImage
  from "../../assets/images/football-field.jpg";

import "./FieldCard.css";


function FieldCard({

  id,
  name,
  address,
  type,
  status,
  selectedDate,
  slots = []

}) {

  const navigate =
    useNavigate();


  /* =========================================================
     CHECK USER LOGIN
  ========================================================= */

  const getCurrentUser = () => {

    try {

      return JSON.parse(
        localStorage.getItem(
          "user"
        )
      );

    } catch {

      return null;
    }
  };


  /* =========================================================
     AVAILABLE SLOT
  ========================================================= */

  const hasAvailableSlot =
    slots.some(
      slot =>
        slot.available
    );


  /* =========================================================
     MIN PRICE
  ========================================================= */

  const prices =
    slots
      .map(
        slot =>
          Number(
            slot.Price
          )
      )
      .filter(
        price =>
          !Number.isNaN(
            price
          )
      );


  const minPrice =
    prices.length > 0
      ? Math.min(
          ...prices
        )
      : 0;


  /* =========================================================
     FIELD STATUS
  ========================================================= */

  const fieldAvailable =
    status === "AVAILABLE";


  /* =========================================================
     CHOOSE FIELD
  ========================================================= */

  const handleChooseField = () => {

    const user =
      getCurrentUser();


    const bookingUrl =
      `/booking?fieldId=${id}&date=${selectedDate}`;


    /*
      Chưa đăng nhập:
      đưa sang Login và nhớ URL booking.
    */

    if (!user) {

      navigate(
        `/login?redirect=${encodeURIComponent(
          bookingUrl
        )}`
      );

      return;
    }


    /*
      Đã đăng nhập:
      vào thẳng Booking.
    */

    navigate(
      bookingUrl
    );
  };


  return (

    <article
      className="field-card"
    >

      {/* IMAGE */}

      <div
        className="field-image-wrapper"
      >

        <img

          src={
            fieldImage
          }

          alt={
            name
          }

          className="field-image"

        />


        <span
          className={
            fieldAvailable
              ? "field-status field-status--available"
              : "field-status field-status--maintenance"
          }
        >

          {
            fieldAvailable
              ? "Đang hoạt động"
              : "Bảo trì"
          }

        </span>

      </div>


      {/* CONTENT */}

      <div
        className="field-content"
      >

        {/* TITLE */}

        <div
          className="field-title-row"
        >

          <h3
            title={
              name
            }
          >

            {name}

          </h3>

        </div>


        {/* INFORMATION */}

        <div
          className="field-info"
        >

          <div
            className="field-info-row"
          >

            <MapPin
              size={16}
            />

            <span>
              {address}
            </span>

          </div>


          <div
            className="field-info-row"
          >

            <Users
              size={16}
            />

            <span>
              {type}
            </span>

          </div>


          <div
            className="field-info-row"
          >

            <CalendarDays
              size={16}
            />

            <span>
              {selectedDate}
            </span>

          </div>

        </div>


        {/* SLOTS */}

        <div
          className="field-slots"
        >

          <div
            className="field-slots-title"
          >
            KHUNG GIỜ
          </div>


          {
            slots.length === 0
              ? (

                <div
                  className="field-no-slot"
                >

                  Chưa có bảng giá

                </div>

              )
              : (

                slots.map(
                  slot => (

                    <div

                      key={
                        slot.PriceID
                      }

                      className={
                        slot.available
                          ? "field-slot available"
                          : "field-slot booked"
                      }

                    >

                      {/* TIME + PRICE */}

                      <div
                        className="field-slot-main"
                      >

                        <strong>

                          {
                            slot.StartTime
                          }

                          {" - "}

                          {
                            slot.EndTime
                          }

                        </strong>


                        <span
                          className="field-slot-price"
                        >

                          {
                            Number(
                              slot.Price || 0
                            ).toLocaleString(
                              "vi-VN"
                            )
                          }

                          đ

                        </span>

                      </div>


                      {/* STATUS */}

                      <span
                        className="field-slot-status"
                      >

                        {
                          slot.available
                            ? "Trống"
                            : (
                              slot.reason
                              ===
                              "FIELD_UNAVAILABLE"
                                ? "Bảo trì"
                                : "Đã đặt"
                            )
                        }

                      </span>

                    </div>

                  )
                )
              )
          }

        </div>


        <div
          className="field-divider"
        />


        {/* BOTTOM */}

        <div
          className="field-bottom"
        >

          <div>

            <span
              className="price-label"
            >

              GIÁ THUÊ TỪ

            </span>


            <strong>

              {
                minPrice
                  .toLocaleString(
                    "vi-VN"
                  )
              }

              đ/h

            </strong>

          </div>


          {
            fieldAvailable
            &&
            hasAvailableSlot
              ? (

                <button

                  type="button"

                  className="field-detail-button"

                  onClick={
                    handleChooseField
                  }

                >

                  Chọn sân

                </button>

              )
              : (

                <button

                  type="button"

                  disabled

                  className="
                    field-detail-button
                    field-disabled
                  "

                >

                  {
                    fieldAvailable
                      ? "Hết lịch"
                      : "Bảo trì"
                  }

                </button>

              )
          }

        </div>

      </div>

    </article>
  );
}


export default FieldCard;