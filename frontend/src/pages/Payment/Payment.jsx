import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Clock3
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useMemo,
  useState,
} from "react";

import Navbar
  from "../../components/Navbar/Navbar";

import {
  createBooking
} from "../../services/booking_service";

import "./Payment.css";


const PAYMENT_METHODS = [

  {
    id: "BANK_TRANSFER",
    title: "Chuyển khoản ngân hàng",
    icon: Banknote
  },

  {
    id: "EWALLET",
    title: "Ví điện tử",
    icon: Smartphone
  },

  {
    id: "CARD",
    title: "Thẻ ngân hàng",
    icon: CreditCard
  }

];


const formatPrice = value =>
  Number(
    value || 0
  ).toLocaleString(
    "vi-VN"
  );


const getUser = () => {

  try {

    return JSON.parse(
      localStorage.getItem(
        "user"
      )
      ||
      "null"
    );

  } catch {

    return null;
  }
};


function Payment() {

  const location =
    useLocation();


  const navigate =
    useNavigate();


  const draft =
    useMemo(
      () => {

        if (
          location.state
            ?.bookingDraft
        ) {

          return (
            location.state
              .bookingDraft
          );
        }


        try {

          return JSON.parse(
            localStorage.getItem(
              "bookingDraft"
            )
            ||
            "null"
          );

        } catch {

          return null;
        }

      },
      [
        location.state
      ]
    );


  const user =
    getUser();


  const [
    paymentMethod,
    setPaymentMethod
  ] = useState(
    "BANK_TRANSFER"
  );


  const [
    loading,
    setLoading
  ] = useState(false);


  const [
    error,
    setError
  ] = useState("");


  const [
    booking,
    setBooking
  ] = useState(null);


  /* =========================================================
     SUBMIT BOOKING
  ========================================================= */

  const handlePayment =
    async () => {

      if (
        !draft
        ||
        !user
      ) {

        return;
      }


      try {

        setLoading(
          true
        );

        setError(
          ""
        );


        const result =
          await createBooking({

            UserID:
              user.UserID,

            FieldID:
              draft.FieldID,

            BookingDate:
              draft.BookingDate,

            StartTime:
              draft.StartTime,

            EndTime:
              draft.EndTime,

            PaymentMethod:
              paymentMethod

          });


        setBooking(
          result.Booking
        );


        localStorage.removeItem(
          "bookingDraft"
        );


      } catch (
        bookingError
      ) {

        console.error(
          bookingError
        );


        if (
          bookingError.code
          ===
          "BOOKING_CONFLICT"
        ) {

          setError(
            "Khung giờ vừa được người khác đặt. Vui lòng chọn khung giờ khác."
          );

        } else {

          setError(
            bookingError.message
            ||
            "Không thể gửi yêu cầu đặt sân."
          );
        }


      } finally {

        setLoading(
          false
        );
      }
    };


  /* =========================================================
     NO DRAFT
  ========================================================= */

  if (!draft) {

    return (

      <>

        <Navbar />


        <main
          className="payment-page"
        >

          <section
            className="payment-card"
          >

            <h1>
              Chưa chọn sân
            </h1>


            <p>
              Bạn cần chọn sân và khung giờ trước.
            </p>


            <Link
              to="/fields"
            >

              Quay lại danh sách sân

            </Link>

          </section>

        </main>

      </>

    );
  }


  /* =========================================================
     SUCCESS
  ========================================================= */

  if (booking) {

    return (

      <>

        <Navbar />


        <main
          className="payment-page"
        >

          <div
            className="payment-success"
          >

            <CheckCircle2
              size={48}
            />


            <h1>
              Yêu cầu đặt sân đã được gửi
            </h1>


            <p>

              Mã booking:{" "}

              <strong>
                #{booking.BookingID}
              </strong>

            </p>


            <p>

              Sân:{" "}

              <strong>
                {booking.FieldName}
              </strong>

            </p>


            <p>

              Ngày:{" "}

              <strong>
                {booking.BookingDate}
              </strong>

            </p>


            <p>

              Khung giờ:{" "}

              <strong>

                {
                  booking.StartTime
                }

                {" - "}

                {
                  booking.EndTime
                }

              </strong>

            </p>


            <p>

              Tổng tiền:{" "}

              <strong>

                {
                  formatPrice(
                    booking.TotalAmount
                  )
                }

                đ

              </strong>

            </p>


            <div
              style={{
                marginTop: "20px",
                marginBottom: "20px",
                padding: "14px",
                borderRadius: "10px",
                background: "#fef3c7",
                color: "#92400e"
              }}
            >

              <Clock3
                size={19}
              />


              <strong
                style={{
                  marginLeft: "8px"
                }}
              >

                Trạng thái: Chờ xác nhận

              </strong>


              <p
                style={{
                  marginBottom: 0
                }}
              >

                Admin sẽ kiểm tra và cập nhật trạng thái đơn đặt sân của bạn.

              </p>

            </div>


            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap"
              }}
            >

              <button
                type="button"
                onClick={
                  () =>
                    navigate(
                      "/account"
                    )
                }
              >

                Xem lịch đặt sân

              </button>


              <button
                type="button"
                onClick={
                  () =>
                    navigate(
                      "/fields"
                    )
                }
              >

                Quay lại danh sách sân

              </button>

            </div>

          </div>

        </main>

      </>

    );
  }


  /* =========================================================
     PAYMENT FORM
  ========================================================= */

  return (

    <>

      <Navbar />


      <main
        className="payment-page"
      >

        <section
          className="payment-card"
        >

          <h1>
            Xác nhận yêu cầu đặt sân
          </h1>


          <div
            className="payment-info"
          >

            <p>

              Sân:{" "}

              <strong>
                {draft.FieldName}
              </strong>

            </p>


            <p>

              Ngày:{" "}

              <strong>
                {draft.BookingDate}
              </strong>

            </p>


            <p>

              Khung giờ:{" "}

              <strong>

                {
                  draft.StartTime
                }

                {" - "}

                {
                  draft.EndTime
                }

              </strong>

            </p>


            <p>

              Tổng tiền:{" "}

              <strong>

                {
                  formatPrice(
                    draft.Price
                  )
                }

                đ

              </strong>

            </p>

          </div>


          <h3>
            Phương thức thanh toán dự kiến
          </h3>


          {
            PAYMENT_METHODS.map(
              item => {

                const Icon =
                  item.icon;


                return (

                  <button

                    key={
                      item.id
                    }

                    type="button"

                    className={
                      paymentMethod
                      ===
                      item.id

                        ? "payment-method active"

                        : "payment-method"
                    }

                    onClick={
                      () =>
                        setPaymentMethod(
                          item.id
                        )
                    }

                  >

                    <Icon
                      size={20}
                    />


                    {
                      item.title
                    }

                  </button>

                );
              }
            )
          }


          {
            !user
            &&
            (

              <div>

                Bạn cần đăng nhập.{" "}

                <Link
                  to="/login?redirect=/payment"
                >

                  Đăng nhập

                </Link>

              </div>

            )
          }


          {
            error
            &&
            (

              <p
                className="payment-error"
              >

                {error}

              </p>

            )
          }


          <button

            type="button"

            className="payment-submit"

            disabled={
              !user
              ||
              loading
            }

            onClick={
              handlePayment
            }

          >

            {
              loading
                ? "Đang gửi yêu cầu..."
                : "Gửi yêu cầu đặt sân"
            }

          </button>


          <p
            style={{
              marginTop: "12px",
              fontSize: "13px",
              color: "#64748b"
            }}
          >

            Sau khi gửi, đơn sẽ ở trạng thái
            {" "}
            <strong>
              Chờ xác nhận
            </strong>
            {" "}
            cho đến khi admin xử lý.

          </p>

        </section>

      </main>

    </>
  );
}


export default Payment;