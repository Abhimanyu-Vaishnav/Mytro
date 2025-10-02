from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.urls import reverse
import os
from datetime import timedelta

# Import User model properly
from django.contrib.auth.models import User as AuthUser

class Profile(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'), 
        ('O', 'Other'),
    ]
    
    user = models.OneToOneField(AuthUser, on_delete=models.CASCADE, related_name='profile')
    profile_pic = models.ImageField(
        upload_to='profile_pics/', 
        blank=True, 
        null=True,
        default='profile_pics/default-avatar.jpg'
    )
    cover_pic = models.ImageField(upload_to='cover_pics/', blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500, default='')
    location = models.CharField(max_length=100, blank=True, default='')
    language_preference = models.CharField(max_length=50, blank=True, default='en')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, default='')
    dob = models.DateField(blank=True, null=True)
    website = models.URLField(blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    interests = models.ManyToManyField('Interest', blank=True)
    languages_known = models.CharField(max_length=200, blank=True, default='', help_text='Comma separated languages')
    relationship_status = models.CharField(max_length=50, blank=True, default='')
    education = models.CharField(max_length=200, blank=True, default='')
    work = models.CharField(max_length=200, blank=True, default='')
    hometown = models.CharField(max_length=100, blank=True, default='')
    current_city = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

    @property
    def full_name(self):
        name = f"{self.user.first_name} {self.user.last_name}".strip()
        return name if name else self.user.username

    def get_profile_pic_url(self):
        if self.profile_pic and hasattr(self.profile_pic, 'url'):
            return self.profile_pic.url
        return '/static/images/default-avatar.jpg'

    def get_absolute_url(self):
        return reverse('profile', kwargs={'username': self.user.username})

    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'


class Interest(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, default='', help_text="FontAwesome icon class")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Interest'
        verbose_name_plural = 'Interests'


class Post(models.Model):
    POST_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('poll', 'Poll'),
    ]
    
    author = models.ForeignKey(AuthUser, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField(max_length=5000)
    post_type = models.CharField(max_length=10, choices=POST_TYPES, default='text')
    image = models.ImageField(upload_to='posts/', blank=True, null=True)
    video = models.FileField(upload_to='posts/videos/', blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, default='')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Add repost functionality
    repost_parent = models.ForeignKey('self', on_delete=models.CASCADE, 
                                    null=True, blank=True, related_name='reposts')
    is_quote = models.BooleanField(default=False)
    quote_text = models.TextField(max_length=1000, blank=True, default='')
    
    # Poll fields
    poll_options = models.JSONField(null=True, blank=True)
    poll_multiple_choice = models.BooleanField(default=False)
    poll_end_date = models.DateTimeField(null=True, blank=True)


    @property
    def repost_count(self):
        return self.reposts.count()


    def __str__(self):
        return f"{self.author.username}: {self.content[:30]}"

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.count()

    @property
    def share_count(self):
        return self.shares.count()

    def get_absolute_url(self):
        return reverse('post_detail', kwargs={'pk': self.pk})

    def save(self, *args, **kwargs):
        if not self.content and self.image:
            self.content = "Check out this image!"
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'


class Like(models.Model):
    user = models.ForeignKey(AuthUser, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} liked {self.post.content[:30]}"

    class Meta:
        unique_together = ['user', 'post']
        verbose_name = 'Like'
        verbose_name_plural = 'Likes'


class Comment(models.Model):
    user = models.ForeignKey(AuthUser, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField(max_length=1000)
    image = models.ImageField(upload_to='comments/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}"

    @property
    def is_reply(self):
        return self.parent is not None

    @property
    def reply_count(self):
        return self.replies.count()

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'


class Follow(models.Model):
    follower = models.ForeignKey(AuthUser, on_delete=models.CASCADE, related_name='following')
    following = models.ForeignKey(AuthUser, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.follower.username} follows {self.following.username}"

    class Meta:
        unique_together = ['follower', 'following']
        verbose_name = 'Follow'
        verbose_name_plural = 'Follows'


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('like', 'Like'),
        ('comment', 'Comment'),
        ('follow', 'Follow'),
        ('mention', 'Mention'),
        ('share', 'Share'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    verb = models.CharField(max_length=255)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='like')
    target_post = models.ForeignKey(Post, on_delete=models.CASCADE, blank=True, null=True)
    target_comment = models.ForeignKey(Comment, on_delete=models.CASCADE, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.username} - {self.verb}"

    @property
    def is_recent(self):
        return timezone.now() - self.timestamp < timedelta(hours=24)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField()
    image = models.ImageField(upload_to='messages/', blank=True, null=True)
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username}"

    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'


class Chat(models.Model):
    participants = models.ManyToManyField(User, related_name='chats')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_group_chat = models.BooleanField(default=False)
    group_name = models.CharField(max_length=255, blank=True, default='')
    group_photo = models.ImageField(upload_to='group_photos/', blank=True, null=True)

    def __str__(self):
        if self.is_group_chat:
            return f"Group: {self.group_name}"
        participants = self.participants.all()
        if participants.count() == 2:
            return f"Chat: {participants[0].username} & {participants[1].username}"
        return f"Chat {self.id}"

    class Meta:
        verbose_name = 'Chat'
        verbose_name_plural = 'Chats'


class ChatMessage(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message from {self.sender.username} in chat {self.chat.id}"

    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'


class Story(models.Model):
    STORY_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    story_type = models.CharField(max_length=10, choices=STORY_TYPES, default='text')
    text_content = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='stories/', blank=True, null=True)
    video = models.FileField(upload_to='stories/videos/', blank=True, null=True)
    background_color = models.CharField(max_length=7, default='#ff6b35')
    caption = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Story by {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def view_count(self):
        return self.views.count()

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Story'
        verbose_name_plural = 'Stories'


class StoryView(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='views')
    viewer = models.ForeignKey(User, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.viewer.username} viewed story {self.story.id}"

    class Meta:
        unique_together = ['story', 'viewer']
        verbose_name = 'Story View'
        verbose_name_plural = 'Story Views'


class SavedPost(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_posts')
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)
    folder = models.CharField(max_length=100, blank=True, default='General')

    def __str__(self):
        return f"{self.user.username} saved post {self.post.id}"

    class Meta:
        unique_together = ['user', 'post']
        verbose_name = 'Saved Post'
        verbose_name_plural = 'Saved Posts'


class Report(models.Model):
    REPORT_TYPES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('inappropriate', 'Inappropriate Content'),
        ('violence', 'Violence'),
        ('hate_speech', 'Hate Speech'),
        ('other', 'Other'),
    ]
    
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    reported_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_received', blank=True, null=True)
    reported_post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports', blank=True, null=True)
    reported_comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reports', blank=True, null=True)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='other')
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Report by {self.reporter.username}"

    def resolve(self):
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save()

    class Meta:
        verbose_name = 'Report'
        verbose_name_plural = 'Reports'


class Block(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocks_made')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocks_received')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"

    class Meta:
        unique_together = ['blocker', 'blocked']
        verbose_name = 'Block'
        verbose_name_plural = 'Blocks'


class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('post_created', 'Post Created'),
        ('post_edited', 'Post Edited'),
        ('post_deleted', 'Post Deleted'),
        ('profile_updated', 'Profile Updated'),
        ('follow', 'Follow User'),
        ('unfollow', 'Unfollow User'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=255)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES, default='login')
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Activity by {self.user.username} - {self.action}"

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'


class Hashtag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    posts = models.ManyToManyField(Post, related_name='hashtags', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    usage_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"#{self.name}"

    class Meta:
        verbose_name = 'Hashtag'
        verbose_name_plural = 'Hashtags'


class Share(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='shares')
    shared_at = models.DateTimeField(auto_now_add=True)
    caption = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.user.username} shared post {self.post.id}"

    class Meta:
        verbose_name = 'Share'
        verbose_name_plural = 'Shares'


class PollVote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poll_votes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='poll_votes')
    option_index = models.IntegerField()
    voted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} voted on poll {self.post.id}"

    class Meta:
        unique_together = ['user', 'post', 'option_index']
        verbose_name = 'Poll Vote'
        verbose_name_plural = 'Poll Votes'


class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_group = models.BooleanField(default=False)
    group_name = models.CharField(max_length=100, blank=True, default='')
    group_photo = models.ImageField(upload_to='conversations/', blank=True, null=True)
    
    def __str__(self):
        if self.is_group:
            return f"Group: {self.group_name}"
        participants = self.participants.all()
        if participants.count() == 2:
            return f"Chat: {participants[0].username} & {participants[1].username}"
        return f"Conversation {self.id}"
    
    @property
    def last_message(self):
        return self.messages.last()
    
    def get_other_participant(self, user):
        return self.participants.exclude(id=user.id).first()
    
    class Meta:
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'


class ConversationMessage(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='conversation_messages/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    def __str__(self):
        return f"Message from {self.sender.username} in {self.conversation}"
    
    @property
    def is_edited(self):
        return self.edited_at is not None
    
    class Meta:
        ordering = ['timestamp']
        verbose_name = 'Conversation Message'
        verbose_name_plural = 'Conversation Messages'


# Signal to create profile when user is created
@receiver(post_save, sender=AuthUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)

@receiver(post_save, sender=AuthUser)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()