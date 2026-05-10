package com.metamuse.service;

import com.metamuse.model.*;
import com.metamuse.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ForumService implements IService<Post> {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final DiscussionRepository discussionRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Post add(Post post) {
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public Post update(Post post) {
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        postRepository.deleteById(id);
    }

    @Override
    public Post findById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    @Override
    public List<Post> getAll() {
        return postRepository.findAll();
    }

    // --- Posts ---

    @Transactional
    public Post createPost(String userId, String title, String content) {
        User user = userRepository.findById(userId).orElseThrow();
        Post post = Post.builder()
                .title(title).content(content).user(user)
                .status("ACTIVE").visibility("PUBLIC")
                .build();
        return add(post);
    }

    // --- Comments ---

    public List<Comment> getComments(Long postId) {
        return commentRepository.findByPostId(postId);
    }

    @Transactional
    public Comment addComment(Long postId, String userId, String content) {
        Post post = findById(postId);
        User user = userRepository.findById(userId).orElseThrow();
        Comment comment = Comment.builder().post(post).user(user).content(content).build();
        return commentRepository.save(comment);
    }

    // --- Discussions ---

    public List<Discussion> getAllDiscussions() {
        return discussionRepository.findAll();
    }

    @Transactional
    public Discussion createDiscussion(String userId, String title, String description) {
        User user = userRepository.findById(userId).orElseThrow();
        Discussion discussion = Discussion.builder()
                .title(title).description(description).user(user)
                .build();
        return discussionRepository.save(discussion);
    }

    // --- Messages ---

    public List<Message> getMessages(Long discussionId) {
        return messageRepository.findByDiscussionId(discussionId);
    }

    @Transactional
    public Message sendMessage(Long discussionId, String userId, String content) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new RuntimeException("Discussion not found"));
        User user = userRepository.findById(userId).orElseThrow();
        Message message = Message.builder()
                .discussion(discussion).sender(user).content(content)
                .build();
        return messageRepository.save(message);
    }
}
