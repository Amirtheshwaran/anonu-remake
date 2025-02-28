                       **AnonU Possible Features to implement**

1. **Anonymous Authentication**  
   * Users can post and interact without creating an account.  
   * Firebase Anonymous Authentication assigns a unique identifier to each user session.  
   * allow anonymous logins with elliptic curve cryptograpgy and add captcha for verification  
2. **Post Creation**  
   * Users can submit text-based posts.  
   * Posts are stored in Firebase Firestore with a timestamp for ordering.  
3. **Realtime Feed**  
   * Posts are displayed in reverse chronological order.  
   * The feed updates in real-time as new posts are added.  
4. **PII Filtering (Privacy Protection)**  
   * The system detects and prevents users from sharing personal information (phone numbers, emails, addresses, etc.).  
   * Posts containing sensitive information are blocked before submission.  
5. **Post Reporting System**  
   * Users can report inappropriate posts.  
   * Reported posts are flagged for review and potential removal.  
6. **Basic Moderation**  
   * Filters out offensive language and spam.  
   * Uses predefined keyword detection to ensure a safe environment.  
7. **User Session Persistence**  
   * Users remain signed in even if they close the app.  
   * Session resets upon app uninstallation or device change.  
8. **Post Deletion (User-Controlled)**  
   * Users can delete their own posts.  
   * Deleted posts are removed from Firestore in real-time.  
9. **Like System**   
   * Users can like posts anonymously.  
   * The number of likes is displayed for each post.  
10. **Comment System**   
    * Users can leave anonymous comments under posts.  
    * Comments follow the same moderation and filtering rules as posts.  
11. **Dark Mode Support**  
    * Users can toggle between light and dark themes for better readability.

12\. Anonymous grievance filling

13\. Anonymous queries

12. **Tagging System (Future Scope)(remove for now)**  
    * Users can tag posts with relevant topics.  
    * Helps in organizing posts by categories.  
13. **Hashtag-Based Search (Future Scope)(remove for now)**  
    * Users can search for posts based on hashtags.  
    * Allows easy discovery of trending topics.

**Features that may be overkill:**  
**❌ Push Notifications**   
Firebase Cloud Messaging (FCM) is an option but requires extra setup, server functions is not worth the effort maybe.  
**❌ Tagging & Hashtag-Based Search**  
Searching in Firestore isn't optimized for large-scale text queries, so full-text search would need a service like Algolia, which might be overkill.