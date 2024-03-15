const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}

export { asyncHandler }
// 2nd way

// const asyncHandler = (requestHandler) => {
//     return async (req, res, next) => {
//         try {
//             await requestHandler(req, res, next)
//         } catch (error) {
//             console.error(error)
//             res.status(error.code || 5000).json({
//                 success: false,
//                 message: error.message
//             })
//         }
//     }
// }